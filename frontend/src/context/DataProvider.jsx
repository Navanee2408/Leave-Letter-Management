import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  clearDatabase,
  demoService,
  loadDatabase,
  saveDatabase,
} from '../services/demoStore'
import { createSeedData } from '../data/demoData'
import { DataContext } from './dataContextObject'
import { useAuth } from '../hooks/useAuth'
import { DEMO_STORAGE_KEY, ROLES } from '../constants'
import { saveDemoHodPassword } from '../data/demoAuth'
import { getAccessToken } from '../services/api/client'
import {
  departmentApi,
  hodApi,
  classApi,
  tutorApi,
  studentApi,
  parentApi,
  leaveApi,
  notificationApi,
} from '../services/api'
import {
  onNewNotification,
  onNotificationRead,
} from '../services/api/socketClient'
import {
  toBackendLeaveType,
  transformDepartment,
  transformClass,
  transformHod,
  transformTutor,
  transformStudent,
  transformParent,
  transformLeave,
  transformNotification,
} from '../services/api/dataTransformers'
import toast from 'react-hot-toast'

function commit(setDb, operation) {
  setDb((current) => {
    const next = operation(current)
    saveDatabase(next)
    return next
  })
}

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [db, setDb] = useState(loadDatabase)
  const [isLoadingBackend, setIsLoadingBackend] = useState(false)

  useEffect(() => {
    const syncDatabase = (event) => {
      if (event.key === DEMO_STORAGE_KEY) setDb(loadDatabase())
    }
    window.addEventListener('storage', syncDatabase)
    return () => window.removeEventListener('storage', syncDatabase)
  }, [])

  const isBackend = Boolean(user && (user.isBackend || getAccessToken()))

  const refreshBackendData = useCallback(async () => {
    if (!user || (!user.isBackend && !getAccessToken())) return
    try {
      setIsLoadingBackend(true)
      const role = user.role

      if (role === ROLES.ADMIN) {
        const [
          deptRes,
          classRes,
          hodRes,
          tutorRes,
          studentRes,
          parentRes,
          leaveRes,
          notifRes,
        ] = await Promise.all([
          departmentApi.list({ limit: 100 }).catch(() => ({ departments: [] })),
          classApi.list({ limit: 100 }).catch(() => ({ classes: [] })),
          hodApi.list({ limit: 100 }).catch(() => ({ hods: [] })),
          tutorApi.list({ limit: 100 }).catch(() => ({ tutors: [] })),
          studentApi.list({ limit: 100 }).catch(() => ({ students: [] })),
          parentApi.list({ limit: 100 }).catch(() => ({ parents: [] })),
          leaveApi.list({ limit: 100 }).catch(() => ({ applications: [] })),
          notificationApi.listMy({ limit: 50 }).catch(() => ({ notifications: [] })),
        ])

        const parentsList = parentRes.parents || []
        const parentChildrenPairs = await Promise.all(
          parentsList.map(async (p) => {
            const pId = String(p.id || p._id)
            try {
              const res = await parentApi.getChildren(pId)
              const childIds = (res.children || []).map((c) =>
                String(c.student?._id || c.student?.id || c.student || c._id || c.id),
              )
              return { parentId: pId, childIds }
            } catch {
              return { parentId: pId, childIds: [] }
            }
          }),
        )
        const parentChildMap = new Map(
          parentChildrenPairs.map((x) => [x.parentId, x.childIds]),
        )
        const studentToParentMap = new Map()
        parentChildrenPairs.forEach((x) => {
          x.childIds.forEach((cId) => studentToParentMap.set(cId, x.parentId))
        })

        const leaveApps = leaveRes.data?.applications || leaveRes.applications || []
        setDb((current) => ({
          ...current,
          departments: (deptRes.departments || []).map(transformDepartment),
          classes: (classRes.classes || []).map(transformClass),
          hods: (hodRes.hods || []).map(transformHod),
          tutors: (tutorRes.tutors || []).map(transformTutor),
          students: (studentRes.students || []).map((s) => {
            const sId = String(s._id || s.id)
            return transformStudent(s, studentToParentMap.get(sId) || null)
          }),
          parents: parentsList.map((p) => {
            const pId = String(p._id || p.id)
            return transformParent(p, parentChildMap.get(pId) || [])
          }),
          leaves: leaveApps.map(transformLeave),
          notifications: (notifRes.data?.notifications || notifRes.notifications || []).map((n) =>
            transformNotification(n, user),
          ),
        }))
      } else if (role === ROLES.HOD) {
        const [
          deptRes,
          classRes,
          tutorRes,
          studentRes,
          leaveRes,
          notifRes,
        ] = await Promise.all([
          user.departmentId
            ? departmentApi.getById(user.departmentId).catch(() => ({ department: null }))
            : departmentApi.list({ limit: 100 }).catch(() => ({ departments: [] })),
          classApi
            .list({ limit: 100, department: user.departmentId || undefined })
            .catch(() => ({ classes: [] })),
          tutorApi
            .list({ limit: 100, department: user.departmentId || undefined })
            .catch(() => ({ tutors: [] })),
          studentApi
            .list({ limit: 100, department: user.departmentId || undefined })
            .catch(() => ({ students: [] })),
          leaveApi.list({ limit: 100 }).catch(() => ({ applications: [] })),
          notificationApi.listMy({ limit: 50 }).catch(() => ({ notifications: [] })),
        ])

        const dept = deptRes.department
          ? transformDepartment(deptRes.department)
          : (deptRes.departments || []).map(transformDepartment)[0] || null

        const leaveApps = leaveRes.data?.applications || leaveRes.applications || []
        setDb((current) => ({
          ...current,
          departments: dept ? [dept] : current.departments,
          classes: (classRes.classes || []).map(transformClass),
          hods: [transformHod(user)],
          tutors: (tutorRes.tutors || []).map(transformTutor),
          students: (studentRes.students || []).map((s) => transformStudent(s)),
          leaves: leaveApps.map(transformLeave),
          notifications: (notifRes.data?.notifications || notifRes.notifications || []).map((n) =>
            transformNotification(n, user),
          ),
        }))
      } else if (role === ROLES.CLASS_TUTOR) {
        const [classesRes, studentsRes, leavesRes, notifRes] = await Promise.all([
          tutorApi.getMyClasses().catch(() => ({ classes: [] })),
          tutorApi.getMyStudents().catch(() => ({ students: [] })),
          tutorApi.getMyApprovedLeaves({ limit: 100 }).catch(() => ({ applications: [] })),
          notificationApi.listMy({ limit: 50 }).catch(() => ({ notifications: [] })),
        ])

        const transformedClasses = (classesRes.classes || []).map((c) => ({
          ...transformClass(c),
          tutorId: user.id,
        }))

        const deptMap = new Map()
        ;(classesRes.classes || []).forEach((c) => {
          if (c.department && typeof c.department === 'object') {
            const transformedDept = transformDepartment(c.department)
            deptMap.set(transformedDept.id, transformedDept)
          }
        })

        setDb((current) => ({
          ...current,
          departments:
            deptMap.size > 0 ? Array.from(deptMap.values()) : current.departments,
          classes: transformedClasses,
          students: (studentsRes.students || []).map((s) => transformStudent(s)),
          tutors: [
            transformTutor({
              ...user,
              assignedClasses: transformedClasses.map((c) => c.id),
            }),
          ],
          leaves: (leavesRes.data?.applications || leavesRes.applications || []).map(
            transformLeave,
          ),
          notifications: (notifRes.data?.notifications || notifRes.notifications || []).map((n) =>
            transformNotification(n, user),
          ),
        }))
      } else if (role === ROLES.PARENT) {
        const [childrenRes, leavesRes, notifRes] = await Promise.all([
          parentApi.getMyChildren({ limit: 50 }).catch(() => ({ children: [] })),
          leaveApi.listMy({ limit: 100 }).catch(() => ({ applications: [] })),
          notificationApi.listMy({ limit: 50 }).catch(() => ({ notifications: [] })),
        ])

        const childLinks = childrenRes.children || []
        const students = childLinks.map((link) => {
          const studentDoc = link.student || link
          return transformStudent(studentDoc, user.id)
        })
        const childIds = students.map((s) => s.id)

        const deptMap = new Map()
        const classMap = new Map()
        childLinks.forEach((link) => {
          const s = link.student || link
          if (s.department && typeof s.department === 'object') {
            const transformedDept = transformDepartment(s.department)
            deptMap.set(transformedDept.id, transformedDept)
          }
          if (s.class && typeof s.class === 'object') {
            const transformedClass = transformClass(s.class)
            classMap.set(transformedClass.id, transformedClass)
          }
        })

        setDb((current) => ({
          ...current,
          departments:
            deptMap.size > 0 ? Array.from(deptMap.values()) : current.departments,
          classes:
            classMap.size > 0 ? Array.from(classMap.values()) : current.classes,
          students,
          parents: [transformParent(user, childIds)],
          leaves: (leavesRes.data?.applications || leavesRes.applications || []).map(
            transformLeave,
          ),
          notifications: (notifRes.data?.notifications || notifRes.notifications || []).map((n) =>
            transformNotification(n, user),
          ),
        }))
      }
    } catch (err) {
      console.warn('Failed to refresh backend data:', err)
    } finally {
      setIsLoadingBackend(false)
    }
  }, [user])

  // Initial data loading when backend user is authenticated
  useEffect(() => {
    if (user && isBackend) {
      refreshBackendData()
    }
  }, [user, isBackend, refreshBackendData])

  // Real-time socket event listeners
  useEffect(() => {
    if (!user || !isBackend) return

    const unsubNew = onNewNotification((payload) => {
      if (payload?.notification) {
        const incoming = transformNotification(payload.notification, user)
        setDb((current) => {
          const existing = current.notifications || []
          if (existing.some((n) => n.id === incoming.id)) return current
          return {
            ...current,
            notifications: [incoming, ...existing],
          }
        })
        toast.success(`${incoming.title}: ${incoming.message}`)
      }
    })

    const unsubRead = onNotificationRead((payload) => {
      setDb((current) => {
        const userKey = `${user.role}:${user.id}`
        return {
          ...current,
          notifications: (current.notifications || []).map((n) => {
            if (payload?.all || n.id === payload?.notificationId) {
              const readBy = new Set(n.readBy || [])
              readBy.add(userKey)
              return { ...n, isRead: true, readBy: Array.from(readBy) }
            }
            return n
          }),
        }
      })
    })

    return () => {
      unsubNew()
      unsubRead()
    }
  }, [user, isBackend])

  // --- CRUD Operations ---

  const addDepartment = useCallback(
    async (payload) => {
      if (isBackend) {
        try {
          await departmentApi.create({
            code: payload.code,
            name: payload.name,
            description: payload.description || undefined,
            status: payload.status ? payload.status.toUpperCase() : undefined,
          })
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to create department'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) => demoService.addDepartment(current, payload))
    },
    [isBackend, refreshBackendData],
  )

  const updateDepartment = useCallback(
    async (id, payload) => {
      if (isBackend) {
        try {
          if (payload.status) {
            await departmentApi.setStatus(id, payload.status.toUpperCase())
          }
          const updateData = {}
          if (payload.name) updateData.name = payload.name
          if (payload.code) updateData.code = payload.code
          if (payload.description !== undefined) updateData.description = payload.description
          if (Object.keys(updateData).length > 0) {
            await departmentApi.update(id, updateData)
          }
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to update department'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) =>
        demoService.updateDepartment(current, id, payload),
      )
    },
    [isBackend, refreshBackendData],
  )

  const deleteDepartment = useCallback(
    async (id) => {
      if (isBackend) {
        try {
          await departmentApi.setStatus(id, 'INACTIVE')
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to delete department'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) => demoService.deleteDepartment(current, id))
    },
    [isBackend, refreshBackendData],
  )

  const addHod = useCallback(
    async (payload) => {
      if (isBackend) {
        try {
          await hodApi.create({
            fullName: payload.name || payload.fullName,
            email: payload.email,
            password: payload.password,
            phone: payload.phone || undefined,
            employeeId: payload.employeeId || undefined,
            department: payload.departmentId || payload.department,
          })
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to create HOD'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) => {
        const next = demoService.addHod(current, payload, { replaceActive: true })
        const added = next.hods.find(
          (hod) => !current.hods.some((currentHod) => currentHod.id === hod.id),
        )
        if (added && payload.password) saveDemoHodPassword(added.id, payload.password)
        return next
      })
    },
    [isBackend, refreshBackendData],
  )

  const updateHod = useCallback(
    async (id, payload) => {
      if (isBackend) {
        try {
          if (payload.status) {
            await hodApi.setStatus(id, payload.status.toUpperCase())
          }
          const updateData = {}
          if (payload.name || payload.fullName) updateData.fullName = payload.name || payload.fullName
          if (payload.email) updateData.email = payload.email
          if (payload.phone) updateData.phone = payload.phone
          if (payload.employeeId) updateData.employeeId = payload.employeeId
          if (payload.departmentId || payload.department) {
            updateData.department = payload.departmentId || payload.department
          }
          if (Object.keys(updateData).length > 0) {
            await hodApi.update(id, updateData)
          }
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to update HOD'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) => demoService.updateHod(current, id, payload))
    },
    [isBackend, refreshBackendData],
  )

  const deleteHod = useCallback(
    async (id) => {
      if (isBackend) {
        try {
          await hodApi.setStatus(id, 'INACTIVE')
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to delete HOD'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) => demoService.deleteHod(current, id))
    },
    [isBackend, refreshBackendData],
  )

  const assignHod = useCallback(
    async (departmentId, hodId) => {
      if (isBackend) {
        try {
          await hodApi.update(hodId, { department: departmentId })
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to assign HOD'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) =>
        demoService.assignHod(current, departmentId, hodId),
      )
    },
    [isBackend, refreshBackendData],
  )

  const updateAccountStatus = useCallback(
    async (role, id, status) => {
      if (isBackend) {
        try {
          const s = (status || '').toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'
          if (role === ROLES.HOD) {
            await hodApi.setStatus(id, s)
          } else if (role === ROLES.CLASS_TUTOR || role === 'TUTOR') {
            await tutorApi.setStatus(id, s)
          } else if (role === ROLES.PARENT) {
            await parentApi.setStatus(id, s)
          } else if (role === 'DEPARTMENT') {
            await departmentApi.setStatus(id, s)
          } else if (role === 'CLASS') {
            await classApi.setStatus(id, s)
          } else if (role === 'STUDENT') {
            await studentApi.setStatus(id, s)
          }
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to update account status'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) =>
        demoService.updateAccountStatus(current, role, id, status),
      )
    },
    [isBackend, refreshBackendData],
  )

  const addClass = useCallback(
    async (payload) => {
      if (isBackend) {
        try {
          await classApi.create({
            className: payload.className || `${payload.year || '1'}-${payload.section || 'A'}`,
            year: String(payload.year || '1'),
            section: String(payload.section || 'A'),
            department: payload.departmentId || payload.department,
            assignedTutor: payload.tutorId || payload.assignedTutor || null,
          })
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to create class'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) => demoService.addClass(current, payload))
    },
    [isBackend, refreshBackendData],
  )

  const updateClass = useCallback(
    async (id, payload) => {
      if (isBackend) {
        try {
          if (payload.status) {
            await classApi.setStatus(id, payload.status.toUpperCase())
          }
          const updateData = {}
          if (payload.className) updateData.className = payload.className
          if (payload.year) updateData.year = String(payload.year)
          if (payload.section) updateData.section = String(payload.section)
          if (payload.departmentId || payload.department) {
            updateData.department = payload.departmentId || payload.department
          }
          if (payload.tutorId !== undefined || payload.assignedTutor !== undefined) {
            updateData.assignedTutor = payload.tutorId !== undefined ? payload.tutorId : payload.assignedTutor
          }
          if (Object.keys(updateData).length > 0) {
            await classApi.update(id, updateData)
          }
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to update class'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) => demoService.updateClass(current, id, payload))
    },
    [isBackend, refreshBackendData],
  )

  const deleteClass = useCallback(
    async (id) => {
      if (isBackend) {
        try {
          await classApi.setStatus(id, 'INACTIVE')
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to delete class'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) => demoService.deleteClass(current, id))
    },
    [isBackend, refreshBackendData],
  )

  const addStudent = useCallback(
    async (payload) => {
      if (isBackend) {
        try {
          const res = await studentApi.create({
            fullName: payload.name || payload.fullName,
            registerNumber: payload.registerNumber,
            department: payload.departmentId || payload.department,
            class: payload.classId || payload.class,
            phone: payload.phone || undefined,
            email: payload.email,
          })
          const studentId = res.student?.id || res.student?._id
          if (studentId && payload.parentId) {
            await parentApi.addChild(payload.parentId, {
              studentId,
              relationship: payload.relationship || 'Guardian',
            }).catch(() => {})
          }
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to create student'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) => demoService.addStudent(current, payload))
    },
    [isBackend, refreshBackendData],
  )

  const updateStudent = useCallback(
    async (id, payload) => {
      if (isBackend) {
        try {
          if (payload.status) {
            await studentApi.setStatus(id, payload.status.toUpperCase())
          }
          const updateData = {}
          if (payload.name || payload.fullName) updateData.fullName = payload.name || payload.fullName
          if (payload.registerNumber) updateData.registerNumber = payload.registerNumber
          if (payload.departmentId || payload.department) {
            updateData.department = payload.departmentId || payload.department
          }
          if (payload.classId || payload.class) {
            updateData.class = payload.classId || payload.class
          }
          if (payload.phone) updateData.phone = payload.phone
          if (payload.email) updateData.email = payload.email
          if (Object.keys(updateData).length > 0) {
            await studentApi.update(id, updateData)
          }
          if (payload.parentId) {
            await parentApi.addChild(payload.parentId, {
              studentId: id,
              relationship: payload.relationship || 'Guardian',
            }).catch(() => {})
          }
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to update student'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) => demoService.updateStudent(current, id, payload))
    },
    [isBackend, refreshBackendData],
  )

  const deleteStudent = useCallback(
    async (id) => {
      if (isBackend) {
        try {
          await studentApi.setStatus(id, 'INACTIVE')
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to delete student'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) => demoService.deleteStudent(current, id))
    },
    [isBackend, refreshBackendData],
  )

  const addParent = useCallback(
    async (payload) => {
      if (isBackend) {
        try {
          const res = await parentApi.create({
            fullName: payload.name || payload.fullName,
            email: payload.email,
            password: payload.password,
            phone: payload.phone || undefined,
          })
          const parentId = res.parent?.id || res.parent?._id
          const childIds = payload.childIds || (payload.studentId ? [payload.studentId] : [])
          if (parentId && childIds.length > 0) {
            for (const childId of childIds) {
              await parentApi.addChild(parentId, {
                studentId: childId,
                relationship: payload.relationship || 'Guardian',
              }).catch(() => {})
            }
          }
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to create parent'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) => demoService.addParent(current, payload))
    },
    [isBackend, refreshBackendData],
  )

  const updateParent = useCallback(
    async (id, payload) => {
      if (isBackend) {
        try {
          if (payload.status) {
            await parentApi.setStatus(id, payload.status.toUpperCase())
          }
          const updateData = {}
          if (payload.name || payload.fullName) updateData.fullName = payload.name || payload.fullName
          if (payload.email) updateData.email = payload.email
          if (payload.phone) updateData.phone = payload.phone
          if (Object.keys(updateData).length > 0) {
            await parentApi.update(id, updateData)
          }
          if (payload.childIds && Array.isArray(payload.childIds)) {
            for (const childId of payload.childIds) {
              await parentApi.addChild(id, {
                studentId: childId,
                relationship: payload.relationship || 'Guardian',
              }).catch(() => {})
            }
          }
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to update parent'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) => demoService.updateParent(current, id, payload))
    },
    [isBackend, refreshBackendData],
  )

  const deleteParent = useCallback(
    async (id) => {
      if (isBackend) {
        try {
          await parentApi.setStatus(id, 'INACTIVE')
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to delete parent'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) => demoService.deleteParent(current, id))
    },
    [isBackend, refreshBackendData],
  )

  const addTutor = useCallback(
    async (payload) => {
      if (isBackend) {
        try {
          await tutorApi.create({
            fullName: payload.name || payload.fullName,
            email: payload.email,
            password: payload.password,
            phone: payload.phone || undefined,
            employeeId: payload.employeeId || undefined,
            department: payload.departmentId || payload.department,
            assignedClasses: payload.classIds || payload.assignedClasses || [],
          })
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to create tutor'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) => demoService.addTutor(current, payload))
    },
    [isBackend, refreshBackendData],
  )

  const updateTutor = useCallback(
    async (id, payload) => {
      if (isBackend) {
        try {
          if (payload.status) {
            await tutorApi.setStatus(id, payload.status.toUpperCase())
          }
          const updateData = {}
          if (payload.name || payload.fullName) updateData.fullName = payload.name || payload.fullName
          if (payload.email) updateData.email = payload.email
          if (payload.phone) updateData.phone = payload.phone
          if (payload.employeeId) updateData.employeeId = payload.employeeId
          if (payload.departmentId || payload.department) {
            updateData.department = payload.departmentId || payload.department
          }
          if (payload.classIds || payload.assignedClasses) {
            updateData.assignedClasses = payload.classIds || payload.assignedClasses
          }
          if (Object.keys(updateData).length > 0) {
            await tutorApi.update(id, updateData)
          }
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to update tutor'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) => demoService.updateTutor(current, id, payload))
    },
    [isBackend, refreshBackendData],
  )

  const deleteTutor = useCallback(
    async (id) => {
      if (isBackend) {
        try {
          await tutorApi.setStatus(id, 'INACTIVE')
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to delete tutor'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) => demoService.deleteTutor(current, id))
    },
    [isBackend, refreshBackendData],
  )

  const submitLeave = useCallback(
    async (payload) => {
      if (isBackend) {
        try {
          const formData = new FormData()
          formData.append('studentId', payload.studentId)
          formData.append('leaveType', toBackendLeaveType(payload.leaveType))
          formData.append('fromDate', payload.fromDate)
          formData.append('toDate', payload.toDate)
          formData.append('reason', payload.reason)

          const file =
            payload.document instanceof File
              ? payload.document
              : payload.document?.file instanceof File
                ? payload.document.file
                : null

          if (file) {
            formData.append('supportingDocument', file)
          }

          await leaveApi.submit(formData)
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to submit leave'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) => demoService.submitLeave(current, payload, user))
    },
    [isBackend, user, refreshBackendData],
  )

  const approveLeave = useCallback(
    async (id, remarks) => {
      if (isBackend) {
        try {
          await leaveApi.approve(id, remarks)
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to approve leave'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) =>
        demoService.approveLeave(current, id, remarks, user),
      )
    },
    [isBackend, user, refreshBackendData],
  )

  const rejectLeave = useCallback(
    async (id, reason) => {
      if (isBackend) {
        try {
          await leaveApi.reject(id, reason)
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to reject leave'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) =>
        demoService.rejectLeave(current, id, reason, user),
      )
    },
    [isBackend, user, refreshBackendData],
  )

  const resubmitLeave = useCallback(
    async (id, payload) => {
      if (isBackend) {
        try {
          await submitLeave(payload)
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to resubmit leave'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) =>
        demoService.resubmitLeave(current, id, payload, user),
      )
    },
    [isBackend, user, submitLeave],
  )

  const reopenLeave = useCallback(
    async (id, reason) => {
      if (isBackend) {
        try {
          await leaveApi.reopen(id, reason)
          await refreshBackendData()
          return
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Failed to reopen leave'
          toast.error(msg)
          throw err
        }
      }
      commit(setDb, (current) =>
        demoService.reopenLeave(current, id, reason, user),
      )
    },
    [isBackend, user, refreshBackendData],
  )

  const markNotificationRead = useCallback(
    async (id, userKey) => {
      if (isBackend) {
        try {
          await notificationApi.markRead(id)
          setDb((current) => ({
            ...current,
            notifications: (current.notifications || []).map((n) =>
              n.id === id
                ? { ...n, isRead: true, readBy: [userKey || 'read'] }
                : n,
            ),
          }))
          return
        } catch (err) {
          console.warn('Backend markNotificationRead failed, applying local fallback:', err)
        }
      }
      commit(setDb, (current) =>
        demoService.markNotificationRead(current, id, userKey),
      )
    },
    [isBackend],
  )

  const markAllNotificationsRead = useCallback(
    async (userToMark) => {
      if (isBackend) {
        try {
          await notificationApi.markAllRead()
          setDb((current) => ({
            ...current,
            notifications: (current.notifications || []).map((n) => ({
              ...n,
              isRead: true,
            })),
          }))
          return
        } catch (err) {
          console.warn('Backend markAllNotificationsRead failed, applying local fallback:', err)
        }
      }
      commit(setDb, (current) =>
        demoService.markAllNotificationsRead(current, userToMark),
      )
    },
    [isBackend],
  )

  const resetDemoData = useCallback(() => {
    const fresh = clearDatabase()
    saveDatabase(fresh || createSeedData())
    setDb(fresh)
  }, [])

  const value = useMemo(
    () => ({
      db,
      isLoadingBackend,
      refreshData: refreshBackendData,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      addHod,
      updateHod,
      deleteHod,
      assignHod,
      updateAccountStatus,
      addClass,
      updateClass,
      deleteClass,
      addStudent,
      updateStudent,
      deleteStudent,
      addParent,
      updateParent,
      deleteParent,
      addTutor,
      updateTutor,
      deleteTutor,
      submitLeave,
      approveLeave,
      rejectLeave,
      reopenLeave,
      resubmitLeave,
      markNotificationRead,
      markAllNotificationsRead,
      resetDemoData,
    }),
    [
      db,
      isLoadingBackend,
      refreshBackendData,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      addHod,
      updateHod,
      deleteHod,
      assignHod,
      updateAccountStatus,
      addClass,
      updateClass,
      deleteClass,
      addStudent,
      updateStudent,
      deleteStudent,
      addParent,
      updateParent,
      deleteParent,
      addTutor,
      updateTutor,
      deleteTutor,
      submitLeave,
      approveLeave,
      rejectLeave,
      reopenLeave,
      resubmitLeave,
      markNotificationRead,
      markAllNotificationsRead,
      resetDemoData,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

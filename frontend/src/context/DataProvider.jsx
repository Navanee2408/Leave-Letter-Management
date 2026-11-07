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
import { DEMO_STORAGE_KEY } from '../constants'
import { saveDemoHodPassword } from '../data/demoAuth'

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

  useEffect(() => {
    const syncDatabase = (event) => {
      if (event.key === DEMO_STORAGE_KEY) setDb(loadDatabase())
    }
    window.addEventListener('storage', syncDatabase)
    return () => window.removeEventListener('storage', syncDatabase)
  }, [])

  const addDepartment = useCallback(
    (payload) => commit(setDb, (current) => demoService.addDepartment(current, payload)),
    [],
  )
  const updateDepartment = useCallback(
    (id, payload) =>
      commit(setDb, (current) => demoService.updateDepartment(current, id, payload)),
    [],
  )
  const deleteDepartment = useCallback(
    (id) => commit(setDb, (current) => demoService.deleteDepartment(current, id)),
    [],
  )

  const addHod = useCallback(
    (payload) =>
      commit(setDb, (current) => {
        const next = demoService.addHod(current, payload, { replaceActive: true })
        const added = next.hods.find(
          (hod) => !current.hods.some((currentHod) => currentHod.id === hod.id),
        )
        if (added && payload.password) saveDemoHodPassword(added.id, payload.password)
        return next
      }),
    [],
  )
  const updateHod = useCallback(
    (id, payload) =>
      commit(setDb, (current) => demoService.updateHod(current, id, payload)),
    [],
  )
  const deleteHod = useCallback(
    (id) => commit(setDb, (current) => demoService.deleteHod(current, id)),
    [],
  )
  const assignHod = useCallback(
    (departmentId, hodId) =>
      commit(setDb, (current) =>
        demoService.assignHod(current, departmentId, hodId),
      ),
    [],
  )
  const updateAccountStatus = useCallback(
    (role, id, status) =>
      commit(setDb, (current) =>
        demoService.updateAccountStatus(current, role, id, status),
      ),
    [],
  )

  const addClass = useCallback(
    (payload) => commit(setDb, (current) => demoService.addClass(current, payload)),
    [],
  )
  const updateClass = useCallback(
    (id, payload) =>
      commit(setDb, (current) => demoService.updateClass(current, id, payload)),
    [],
  )
  const deleteClass = useCallback(
    (id) => commit(setDb, (current) => demoService.deleteClass(current, id)),
    [],
  )

  const addStudent = useCallback(
    (payload) => commit(setDb, (current) => demoService.addStudent(current, payload)),
    [],
  )
  const updateStudent = useCallback(
    (id, payload) =>
      commit(setDb, (current) => demoService.updateStudent(current, id, payload)),
    [],
  )
  const deleteStudent = useCallback(
    (id) => commit(setDb, (current) => demoService.deleteStudent(current, id)),
    [],
  )

  const addParent = useCallback(
    (payload) => commit(setDb, (current) => demoService.addParent(current, payload)),
    [],
  )
  const updateParent = useCallback(
    (id, payload) =>
      commit(setDb, (current) => demoService.updateParent(current, id, payload)),
    [],
  )
  const deleteParent = useCallback(
    (id) => commit(setDb, (current) => demoService.deleteParent(current, id)),
    [],
  )

  const addTutor = useCallback(
    (payload) => commit(setDb, (current) => demoService.addTutor(current, payload)),
    [],
  )
  const updateTutor = useCallback(
    (id, payload) =>
      commit(setDb, (current) => demoService.updateTutor(current, id, payload)),
    [],
  )
  const deleteTutor = useCallback(
    (id) => commit(setDb, (current) => demoService.deleteTutor(current, id)),
    [],
  )

  const submitLeave = useCallback(
    (payload) =>
      commit(setDb, (current) => demoService.submitLeave(current, payload, user)),
    [user],
  )
  const approveLeave = useCallback(
    (id, remarks) =>
      commit(setDb, (current) =>
        demoService.approveLeave(current, id, remarks, user),
      ),
    [user],
  )
  const rejectLeave = useCallback(
    (id, reason) =>
      commit(setDb, (current) =>
        demoService.rejectLeave(current, id, reason, user),
      ),
    [user],
  )
  const resubmitLeave = useCallback(
    (id, payload) =>
      commit(setDb, (current) =>
        demoService.resubmitLeave(current, id, payload, user),
      ),
    [user],
  )
  const reopenLeave = useCallback(
    (id, reason) =>
      commit(setDb, (current) =>
        demoService.reopenLeave(current, id, reason, user),
      ),
    [user],
  )

  const markNotificationRead = useCallback(
    (id, userKey) =>
      commit(setDb, (current) =>
        demoService.markNotificationRead(current, id, userKey),
      ),
    [],
  )
  const markAllNotificationsRead = useCallback(
    (userToMark) =>
      commit(setDb, (current) =>
        demoService.markAllNotificationsRead(current, userToMark),
      ),
    [],
  )

  const resetDemoData = useCallback(() => {
    const fresh = clearDatabase()
    saveDatabase(fresh || createSeedData())
    setDb(fresh)
  }, [])

  const value = useMemo(
    () => ({
      db,
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

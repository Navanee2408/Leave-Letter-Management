import { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../../services/api/client'
import PageHeader from '../ui/PageHeader'
import Button from '../ui/Button'
import DataTable from '../ui/DataTable'
import Pagination from '../ui/Pagination'
import SearchBar from '../ui/SearchBar'
import FilterDropdown from '../ui/FilterDropdown'
import Modal from '../ui/Modal'
import ConfirmDialog from '../ui/ConfirmDialog'
import FormInput from '../forms/FormInput'
import FormSelect from '../forms/FormSelect'
import FormTextarea from '../forms/FormTextarea'
import CheckboxGroup from '../forms/CheckboxGroup'
import { usePagination } from '../../hooks/usePagination'

function defaultFor(field) {
  if (field.defaultValue !== undefined) return field.defaultValue
  if (field.type === 'checkbox-group') return []
  return ''
}

function buildInitial(fields, initialValues, row) {
  const base = initialValues?.(row) || {}
  return fields.reduce((values, field) => {
    values[field.name] =
      base[field.name] !== undefined
        ? base[field.name]
        : defaultFor(field)
    return values
  }, {})
}

function isFieldHidden(field, values, editing) {
  if (field.hiddenWhenEditing && Boolean(editing?.id)) return true
  if (typeof field.hidden === 'function') return Boolean(field.hidden(values, editing))
  return Boolean(field.hidden)
}

function isFieldRequired(field, values, editing) {
  if (typeof field.required === 'function') {
    return Boolean(field.required(values, editing))
  }
  if (field.requiredWhenCreating && !editing?.id) return true
  return Boolean(field.required)
}

function validateValues(fields, values, validate, editing) {
  const errors = {}
  fields.forEach((field) => {
    if (isFieldHidden(field, values, editing)) return
    const value = values[field.name]
    if (isFieldRequired(field, values, editing)) {
      const empty =
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      if (empty) errors[field.name] = `${field.label} is required.`
    }
  })
  const customErrors = validate?.(values, editing) || {}
  return { ...errors, ...customErrors }
}

function FieldRenderer({ field, value, error, onChange, formValues, editing }) {
  const [showPassword, setShowPassword] = useState(false)

  if (isFieldHidden(field, formValues, editing)) {
    return null
  }

  const required = isFieldRequired(field, formValues, editing)
  const className = field.full ? 'sm:col-span-2' : ''
  const options =
    typeof field.options === 'function'
      ? field.options(formValues)
      : field.options || []

  if (field.type === 'select') {
    return (
      <FormSelect
        label={field.label}
        name={field.name}
        required={required}
        options={options}
        placeholder={field.placeholder || 'Select an option'}
        value={value ?? ''}
        onChange={(event) => onChange(field.name, event.target.value)}
        error={error}
        hint={field.hint}
        disabled={field.disabledWhenEditing && Boolean(editing?.id)}
        className={className}
      />
    )
  }

  if (field.type === 'textarea') {
    return (
      <FormTextarea
        label={field.label}
        name={field.name}
        required={required}
        rows={field.rows || 3}
        maxLength={field.maxLength}
        valueLength={String(value || '').length}
        value={value ?? ''}
        onChange={(event) => onChange(field.name, event.target.value)}
        error={error}
        hint={field.hint}
        placeholder={field.placeholder}
        className={className}
      />
    )
  }

  if (field.type === 'checkbox-group') {
    return (
      <div className={className}>
        <CheckboxGroup
          label={field.label}
          options={options}
          value={value || []}
          onChange={(next) => onChange(field.name, next)}
          error={error}
          hint={field.hint}
          columns={field.columns || 2}
          emptyText={field.emptyText}
        />
      </div>
    )
  }

  const isPasswordField = field.type === 'password'
  const inputType = isPasswordField
    ? showPassword
      ? 'text'
      : 'password'
    : field.type || 'text'

  return (
    <FormInput
      label={field.label}
      name={field.name}
      type={inputType}
      required={required}
      value={value ?? ''}
      onChange={(event) => onChange(field.name, event.target.value)}
      error={error}
      hint={field.hint}
      placeholder={field.placeholder}
      maxLength={field.maxLength}
      autoComplete={field.autoComplete || (isPasswordField ? 'new-password' : undefined)}
      readOnly={field.readOnlyWhenEditing && Boolean(editing?.id)}
      rightElement={
        isPasswordField ? (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="text-slate-400 hover:text-slate-700"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        ) : undefined
      }
      className={className}
    />
  )
}

export default function CrudPage({
  eyebrow,
  title,
  description,
  entityLabel = 'record',
  rows,
  columns,
  fields,
  searchText,
  searchPlaceholder,
  filters = [],
  filterKey = '',
  perPage = 8,
  initialValues,
  validate,
  onCreate,
  onUpdate,
  onDelete,
  deleteGuard,
  addLabel,
  emptyTitle,
  emptyDescription,
  extraActions,
  allowCreate = true,
  allowDelete = true,
}) {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((row) =>
      String(searchText?.(row) || '')
        .toLowerCase()
        .includes(query),
    )
  }, [rows, search, searchText])

  const pagination = usePagination(filteredRows, perPage)

  useEffect(() => {
    pagination.setPage(1)
  }, [search, filterKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditing({})
    setValues(buildInitial(fields, initialValues, null))
    setErrors({})
  }

  const openEdit = (row) => {
    setEditing(row)
    setValues(buildInitial(fields, initialValues, row))
    setErrors({})
  }

  const closeForm = () => {
    if (saving) return
    setEditing(null)
  }

  const updateValue = (name, value) => {
    setValues((current) => {
      const next = { ...current, [name]: value }
      fields.forEach((field) => {
        if (
          field.dependsOn === name &&
          (field.resetWhen ? field.resetWhen(current, value) : true)
        ) {
          next[field.name] = defaultFor(field)
        }
      })
      return next
    })
    setErrors((current) => {
      const clearedFields = [
        name,
        ...fields
          .filter((field) => field.dependsOn === name)
          .map((field) => field.name),
      ]
      if (!clearedFields.some((fieldName) => current[fieldName])) return current
      const next = { ...current }
      clearedFields.forEach((fieldName) => delete next[fieldName])
      return next
    })
  }

  const [formError, setFormError] = useState('')

  useEffect(() => {
    setFormError('')
  }, [editing])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    const nextErrors = validateValues(fields, values, validate, editing)
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      toast.error('Please review the highlighted fields.')
      return
    }

    setSaving(true)
    try {
      if (editing?.id) {
        await onUpdate?.(editing.id, values)
        toast.success(`${entityLabel} updated.`)
      } else {
        await onCreate?.(values)
        toast.success(`${entityLabel} added.`)
      }
      setEditing(null)
    } catch (error) {
      const message = getErrorMessage(
        error,
        `Failed to ${editing?.id ? 'update' : 'create'} ${entityLabel.toLowerCase()}.`,
      )
      setFormError(message)
      if (!error?._toastShown) {
        toast.error(message)
      }
    } finally {
      setSaving(false)
    }
  }

  const requestDelete = (row) => {
    const guardMessage = deleteGuard?.(row)
    if (guardMessage) {
      toast.error(guardMessage)
      return
    }
    setDeleteTarget(row)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await onDelete?.(deleteTarget.id)
      setDeleteTarget(null)
      toast.success(`${entityLabel} deleted.`)
    } catch (error) {
      if (!error?._toastShown) {
        toast.error(
          getErrorMessage(error, `Failed to delete ${entityLabel.toLowerCase()}.`),
        )
      }
    }
  }

  const tableColumns = useMemo(
    () => [
      ...columns,
      {
        key: 'actions',
        header: 'Actions',
        className: 'w-[104px]',
        headerClassName: 'text-right',
        render: (row) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => openEdit(row)}
              aria-label={`Edit ${row.name || entityLabel}`}
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {allowDelete && (
              <Button
                size="icon-sm"
                variant="ghost"
                className="text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => requestDelete(row)}
                aria-label={`Delete ${row.name || entityLabel}`}
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    // The action renderer intentionally captures the latest component state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns, entityLabel],
  )

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <>
            {extraActions}
            {allowCreate && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                {addLabel || `Add ${entityLabel.toLowerCase()}`}
              </Button>
            )}
          </>
        }
      />

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={searchPlaceholder || `Search ${entityLabel.toLowerCase()}s…`}
          />
          {filters.map((filter) => (
            <FilterDropdown
              key={filter.id}
              id={filter.id}
              label={filter.label}
              value={filter.value}
              onChange={filter.onChange}
              options={filter.options}
              allLabel={filter.allLabel}
              className={filter.className}
            />
          ))}
          <span className="text-xs text-slate-400 sm:ml-auto">
            {filteredRows.length} of {rows.length} records
          </span>
        </div>

        <DataTable
          columns={tableColumns}
          rows={pagination.pageItems}
          empty={
            <div className="py-3 text-center">
              <p className="font-display text-sm font-semibold text-slate-700">
                {emptyTitle || `No ${entityLabel.toLowerCase()} records found`}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {emptyDescription || 'Try adjusting the search or filters.'}
              </p>
            </div>
          }
        />

        <Pagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          onChange={pagination.setPage}
          from={pagination.from}
          to={pagination.to}
          total={pagination.total}
        />
      </section>

      <Modal
        open={Boolean(editing)}
        onClose={closeForm}
        title={
          editing?.id
            ? `Edit ${entityLabel.toLowerCase()}`
            : `Add ${entityLabel.toLowerCase()}`
        }
        description={
          editing?.id
            ? `Update the ${entityLabel.toLowerCase()} details below.`
            : `Create a new ${entityLabel.toLowerCase()} record.`
        }
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeForm} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="crud-entity-form"
              loading={saving}
            >
              {editing?.id ? 'Save changes' : `Add ${entityLabel.toLowerCase()}`}
            </Button>
          </>
        }
      >
        <form
          id="crud-entity-form"
          onSubmit={handleSubmit}
          className="grid gap-4 sm:grid-cols-2"
          noValidate
        >
          {formError && (
            <div
              role="alert"
              className="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
            >
              {formError}
            </div>
          )}
          {fields.map((field) => (
            <FieldRenderer
              key={field.name}
              field={field}
              value={values[field.name]}
              error={errors[field.name]}
              formValues={values}
              editing={editing}
              onChange={updateValue}
            />
          ))}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={`Delete ${entityLabel.toLowerCase()}?`}
        description={`This will permanently remove ${
          deleteTarget?.name || `this ${entityLabel.toLowerCase()}`
        } from the active records.`}
        confirmLabel="Delete record"
      >
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-relaxed text-rose-800">
          This action cannot be undone. Related records may need to be updated
          separately.
        </p>
      </ConfirmDialog>
    </>
  )
}

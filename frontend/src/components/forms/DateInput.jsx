import { forwardRef } from 'react'
import FormInput from './FormInput'

const DateInput = forwardRef(function DateInput(props, ref) {
  return <FormInput ref={ref} type="date" {...props} />
})

export default DateInput

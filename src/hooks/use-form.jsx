import { useState } from 'react'

const defaultValidate = values => ({})

/**
 *
 * @param initialValues
 * @param onSubmit
 * @param onBlur
 * @param resetOnComplete
 * @param validate
 *
 * @return {{values, touchedValues, errors, submitState, handleChange: handleChange, handleSubmit: handleSubmit, handleBlur: handleBlur}}
 */
const useForm = ({
  initialValues,
  onSubmit,
  onBlur,
  resetOnComplete = true,
  validate = defaultValidate,
}) => {
  const [values, setValues] = useState(initialValues || {})
  const [touchedValues, setTouchedValues] = useState({})
  const [errors, setErrors] = useState({})
  const [submitState, setSubmitState] = useState(null)

  const handleChange = event => {
    const target = event.target
    const value = target.type === 'checkbox' ? target.checked : target.value
    const name = target.name

    // if [name] field had error, and it stopped existing, then clear it.
    if (errors[name]) {
      const e = validate({ [name]: value })
      if (!e[name] || e[name] !== errors[name]) {
        setErrors({
          ...errors,
          [name]: '',
        })
      }
    }

    setValues({
      ...values,
      [name]: value,
    })
  }

  const handleBlur = event => {
    const target = event.target
    const name = target.name
    setTouchedValues({
      ...touchedValues,
      [name]: true,
    })
    const picked = Object.entries(values).filter(([key, value]) => key === name)
    const pickedValue = picked[0] && { [picked[0][0]]: picked[0][1] }
    const e = validate(pickedValue)
    setErrors({
      ...errors,
      ...e,
    })
  }

  const onComplete = ({ ok = true, error } = {}) => {
    if (ok && resetOnComplete) {
      setValues(initialValues)
    }
    setSubmitState({ ok, loading: false, error })
  }

  const handleSubmit = event => {
    event.preventDefault()
    const e = validate(values)
    const errorsState = {
      ...errors,
      ...e,
    }
    setErrors(errorsState)

    // if already submitted, don't submit again.
    if (submitState && submitState.loading) {
      console.log('form is loading, please wait', submitState)
      return
    }

    // return early if form has errors
    if (Object.values(errorsState).filter(Boolean).length > 0) {
      return
    }
    setSubmitState({ loading: true })

    onSubmit(values, e, onComplete)
  }

  return {
    values,
    touchedValues,
    errors,
    submitState,
    handleChange,
    handleSubmit,
    handleBlur,
  }
}

export default useForm

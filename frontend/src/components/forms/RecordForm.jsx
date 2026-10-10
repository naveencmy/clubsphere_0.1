import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Notice } from '../common/UI.jsx';
export default function RecordForm({
  fields,
  initial = {},
  onSubmit,
  onCancel,
  submitLabel = 'Save changes',
  busy = false,
  children,
}) {
  const shape = useMemo(
    () =>
      Object.fromEntries(
        fields.map((f) => [
          f.name,
          f.required
            ? z
                .string()
                .trim()
                .min(1, `${f.label} is required.`)
                .refine(
                  (v) => f.type !== 'email' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),
                  'Enter a valid email address.',
                )
            : z.string().optional(),
        ]),
      ),
    [fields],
  );
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: Object.fromEntries(
      fields.map((f) => [f.name, String(initial[f.name] ?? f.default ?? '')]),
    ),
    resolver: zodResolver(z.object(shape)),
  });
  const [error, setError] = useState(null),
    [pending, setPending] = useState(false);
  async function submit(value) {
    setError(null);
    setPending(true);
    try {
      await onSubmit(value);
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <div className="form-grid">
        {fields.map((f) => (
          <div className={`field ${f.full ? 'full' : ''}`} key={f.name}>
            <label htmlFor={`field-${f.name}`}>
              {f.label}
              {f.required ? ' *' : ''}
            </label>
            {f.options ? (
              <select
                id={`field-${f.name}`}
                {...register(f.name)}
                aria-invalid={!!errors[f.name]}
                aria-describedby={errors[f.name] ? `error-${f.name}` : undefined}
              >
                {!f.required && <option value="">None</option>}
                {f.options.map((o) => (
                  <option
                    value={typeof o === 'string' ? o : o.value}
                    key={typeof o === 'string' ? o : o.value}
                  >
                    {typeof o === 'string' ? o : o.label}
                  </option>
                ))}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea
                id={`field-${f.name}`}
                {...register(f.name)}
                aria-invalid={!!errors[f.name]}
                aria-describedby={errors[f.name] ? `error-${f.name}` : undefined}
              />
            ) : (
              <input
                className="input"
                id={`field-${f.name}`}
                type={f.type || 'text'}
                step={f.step}
                min={f.min}
                {...register(f.name)}
                aria-invalid={!!errors[f.name]}
                aria-describedby={errors[f.name] ? `error-${f.name}` : undefined}
              />
            )}{' '}
            {errors[f.name] && (
              <span className="field-error" id={`error-${f.name}`}>
                {errors[f.name].message}
              </span>
            )}
          </div>
        ))}
      </div>
      {typeof children === 'function' ? children(watch()) : children}
      {error && (
        <div style={{ marginTop: 16 }}>
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      <div className="form-actions">
        {onCancel && (
          <Button type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button primary disabled={busy || pending} type="submit">
          {pending ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

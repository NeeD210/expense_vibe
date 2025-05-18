# input-otp: One-Time Password Input for React

## Overview
[input-otp](https://github.com/guilhermerodz/input-otp) is a highly accessible, unstyled, and customizable OTP (One-Time Password) input component for React. It is ideal for authentication flows requiring users to enter a code sent via email or SMS.

---

## 1. Installation

```bash
npm install input-otp
```

---

## 2. Basic Usage

```jsx
import { OTPInput } from 'input-otp';

function MyForm() {
  return (
    <form>
      <OTPInput maxLength={6} render={({ slots }) => (
        <>
          {slots.map((slot, idx) => (
            <div key={idx}>{slot.char ?? slot.placeholderChar}</div>
          ))}
        </>
      )} />
    </form>
  );
}
```

---

## 3. Features
- Accessible and screen reader friendly
- Supports copy-paste, autofill, and mobile input
- Highly customizable (unstyled by default)
- Works with React forms and validation libraries
- Supports custom patterns, separators, and slot rendering

---

## 4. Customization
- **Styling:** Use your own CSS or utility classes (e.g., Tailwind, shadcn/ui)
- **Pattern:** Restrict input to digits, alphanumeric, etc.
  ```jsx
  import { REGEXP_ONLY_DIGITS } from 'input-otp';
  <OTPInput maxLength={6} pattern={REGEXP_ONLY_DIGITS} ... />
  ```
- **Controlled Input:**
  ```jsx
  <OTPInput value={otp} onChange={setOtp} ... />
  ```
- **onComplete:** Callback when all slots are filled
  ```jsx
  <OTPInput maxLength={6} onComplete={(code) => verifyOtp(code)} ... />
  ```

---

## 5. Example with Tailwind and shadcn/ui
```jsx
import { OTPInput } from 'input-otp';

<OTPInput
  maxLength={6}
  containerClassName="flex gap-2"
  render={({ slots }) => (
    <>
      {slots.map((slot, idx) => (
        <div key={idx} className="w-10 h-14 border rounded flex items-center justify-center text-2xl">
          {slot.char ?? slot.placeholderChar}
        </div>
      ))}
    </>
  )}
/>
```

---

## 6. Best Practices
- Use `autocomplete="one-time-code"` for better autofill on mobile
- Validate OTP on the backend
- Show clear error messages for invalid or expired codes
- Use a loading state while verifying

---

## 7. References
- [input-otp GitHub](https://github.com/guilhermerodz/input-otp)
- [shadcn/ui Input OTP](https://ui.shadcn.com/docs/components/input-otp) 
import { useUI } from '../store/useUI'
import { AuthForm } from './AuthForm'
import { Modal } from './ui/Modal'

/** Login / register dialog opened from the top bar for guests. */
export function LoginModal() {
  const loginOpen = useUI((s) => s.loginOpen)
  const closeLogin = useUI((s) => s.closeLogin)

  return (
    <Modal open={loginOpen} onClose={closeLogin} title="Sign in" size="sm">
      <AuthForm onSuccess={closeLogin} />
    </Modal>
  )
}

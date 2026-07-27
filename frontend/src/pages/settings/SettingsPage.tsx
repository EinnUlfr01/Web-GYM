import { FormEvent, MouseEvent, RefObject, useEffect, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/shared/page-header';
import Card from '../../components/ui/card';
import Button from '../../components/ui/button';
import Input from '../../components/ui/input';
import api from '../../api/axios';
import { useAuthStore } from '../../stores/authStore';

type PasswordState = { current: string; new: string; confirm: string };
type PasswordKey = keyof PasswordState;

const emptyPassword: PasswordState = { current: '', new: '', confirm: '' };
const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,128}$/;

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  inputRef?: RefObject<HTMLInputElement>;
  onChange: (value: string) => void;
  onToggle: () => void;
}

function PasswordField({ id, label, value, visible, inputRef, onChange, onToggle }: PasswordFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="label" htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          className="input pr-12"
          type={visible ? 'text' : 'password'}
          autoComplete={id === 'current-password' ? 'current-password' : 'new-password'}
          value={value}
          onChange={event => onChange(event.target.value)}
          required
          maxLength={128}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 transition hover:text-white"
          aria-label={`${visible ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`}
          onClick={onToggle}
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

function backendError(error: unknown): string {
  if (error instanceof AxiosError && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return error instanceof Error ? error.message : 'Không thể cập nhật mật khẩu.';
}

export default function SettingsPage() {
  const { user, clearSession } = useAuthStore();
  const [password, setPassword] = useState<PasswordState>(emptyPassword);
  const [visible, setVisible] = useState<Record<PasswordKey, boolean>>({ current: false, new: false, confirm: false });
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const currentPasswordRef = useRef<HTMLInputElement>(null);

  const clearPasswordForm = () => {
    setPassword(emptyPassword);
    setVisible({ current: false, new: false, confirm: false });
    setFormError('');
  };

  const closeModal = () => {
    if (loading) return;
    setModalOpen(false);
    clearPasswordForm();
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!modalOpen) return;
    currentPasswordRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        event.preventDefault();
        closeModal();
        return;
      }
      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])'),
      ).filter(element => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [modalOpen, loading]);

  const updatePassword = (key: PasswordKey, value: string) => {
    setPassword(current => ({ ...current, [key]: value }));
    setFormError('');
  };

  const validNewPassword = passwordRule.test(password.new);
  const passwordsMatch = password.new === password.confirm;
  const complete = Boolean(password.current && password.new && password.confirm);
  const canSubmit = complete && validNewPassword && passwordsMatch && !loading;

  const handlePasswordChange = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    if (!complete) {
      setFormError('Vui lòng nhập đầy đủ ba trường mật khẩu.');
      return;
    }
    if (!validNewPassword) {
      setFormError('Mật khẩu mới phải có 10–128 ký tự, gồm chữ thường, chữ hoa và chữ số.');
      return;
    }
    if (!passwordsMatch) {
      setFormError('Xác nhận mật khẩu mới không khớp.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/password', {
        current_password: password.current,
        new_password: password.new,
      });
      clearPasswordForm();
      setModalOpen(false);
      toast.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      clearSession();
    } catch (error) {
      setFormError(backendError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) closeModal();
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your account settings" />

      <Card>
        <h3 className="text-lg font-semibold mb-1">Profile Information</h3>
        <p className="text-sm text-[#94A3B8] mb-6">Your account details</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Name" value={user?.name || ''} disabled />
          <Input label="Email" value={user?.email || ''} disabled />
          <Input label="Role" value={user?.role || ''} disabled />
          <Input label="Phone" value={user?.phone || ''} disabled />
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-1">Đổi mật khẩu</h3>
        <p className="mb-6 text-sm text-[#94A3B8]">Cập nhật mật khẩu đăng nhập để bảo vệ tài khoản.</p>
        <Button ref={triggerRef} type="button" onClick={() => setModalOpen(true)}>Đổi mật khẩu</Button>
      </Card>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={handleBackdrop}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
            aria-describedby="change-password-description"
            className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-950 p-5 shadow-2xl sm:p-7"
          >
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <h2 id="change-password-title" className="text-2xl font-bold">Đổi mật khẩu</h2>
                <p id="change-password-description" className="mt-2 text-sm text-slate-400">
                  Nhập mật khẩu hiện tại và mật khẩu mới của bạn.
                </p>
              </div>

              {formError && (
                <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {formError}
                </p>
              )}

              <PasswordField
                id="current-password"
                label="Mật khẩu hiện tại"
                inputRef={currentPasswordRef}
                value={password.current}
                visible={visible.current}
                onChange={value => updatePassword('current', value)}
                onToggle={() => setVisible(current => ({ ...current, current: !current.current }))}
              />
              <PasswordField
                id="new-password"
                label="Mật khẩu mới"
                value={password.new}
                visible={visible.new}
                onChange={value => updatePassword('new', value)}
                onToggle={() => setVisible(current => ({ ...current, new: !current.new }))}
              />
              <PasswordField
                id="confirm-password"
                label="Xác nhận mật khẩu mới"
                value={password.confirm}
                visible={visible.confirm}
                onChange={value => updatePassword('confirm', value)}
                onToggle={() => setVisible(current => ({ ...current, confirm: !current.confirm }))}
              />

              {password.new && !validNewPassword && (
                <p className="text-sm text-amber-300">Mật khẩu mới cần 10–128 ký tự, chữ thường, chữ hoa và chữ số.</p>
              )}
              {password.confirm && !passwordsMatch && (
                <p className="text-sm text-red-300">Xác nhận mật khẩu mới không khớp.</p>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" disabled={loading} onClick={closeModal}>Hủy</Button>
                <Button type="submit" loading={loading} disabled={!canSubmit}>Cập nhật mật khẩu</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

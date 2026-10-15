import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';

type AuthMode = 'login' | 'register';

/** Kiểm tra mật khẩu và xác nhận mật khẩu có khớp nhau không */
function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-dangnhap',
  standalone: false,
  templateUrl: './dangnhap.html',
  styleUrl: './dangnhap.scss',
})
export class DangnhapComponent {
  private fb = inject(FormBuilder);

  readonly bars = [0, 1, 2];

  mode = signal<AuthMode>('login');
  loading = signal(false);
  showLoginPassword = signal(false);
  showRegisterPassword = signal(false);
  showConfirmPassword = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    identifier: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    remember: [false],
  });

  readonly registerForm = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^0\d{9}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      agree: [false, Validators.requiredTrue],
    },
    { validators: passwordsMatchValidator }
  );

  switchMode(mode: AuthMode): void {
    this.mode.set(mode);
  }

  /** Điểm mạnh mật khẩu: 0 (chưa nhập) → 3 (mạnh) */
  get passwordStrength(): number {
    const value = this.registerForm.controls.password.value;
    if (!value) return 0;
    let score = 1;
    if (value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
    if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
    return score;
  }

  get strengthLabel(): string {
    return ['Chưa nhập', 'Yếu', 'Trung bình', 'Mạnh'][this.passwordStrength];
  }

  hasError(form: AbstractControl, field: string): boolean {
    const control = form.get(field);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    // TODO: thay bằng gọi API đăng nhập thực tế (AuthService)
    console.log('Đăng nhập:', this.loginForm.getRawValue());
    setTimeout(() => this.loading.set(false), 800);
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    // TODO: thay bằng gọi API đăng ký thực tế (AuthService)
    const { confirmPassword, ...payload } = this.registerForm.getRawValue();
    console.log('Đăng ký:', payload);
    setTimeout(() => this.loading.set(false), 800);
  }

  loginWithSocial(provider: 'google' | 'facebook'): void {
    // TODO: tích hợp OAuth của Google / Facebook
    console.log('Đăng nhập bằng', provider);
  }
}
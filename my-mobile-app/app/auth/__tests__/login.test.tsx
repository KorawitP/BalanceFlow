import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../login';
import { signInWithEmailAndPassword } from 'firebase/auth';

// Mock Dependencies
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  getAuth: jest.fn(),
}));

jest.mock('../../../firebaseConfig', () => ({
  auth: {},
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    expect(getByPlaceholderText('อีเมล')).toBeTruthy();
    expect(getByPlaceholderText('รหัสผ่าน')).toBeTruthy();
    expect(getByText('เข้าสู่ระบบ')).toBeTruthy();
  });

  it('shows alert if fields are empty', () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('เข้าสู่ระบบ'));
    expect(Alert.alert).toHaveBeenCalledWith('แจ้งเตือน', 'กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
  });

  it('calls signInWithEmailAndPassword when form is filled', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    fireEvent.changeText(getByPlaceholderText('อีเมล'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('รหัสผ่าน'), 'password123');
    
    // Mock success
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: { uid: '123' } });

    fireEvent.press(getByText('เข้าสู่ระบบ'));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
    });
  });

  it('shows error alert on login failure', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    fireEvent.changeText(getByPlaceholderText('อีเมล'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('รหัสผ่าน'), 'wrongpass');
    
    // Mock failure
    const error = { code: 'auth/wrong-password' };
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

    fireEvent.press(getByText('เข้าสู่ระบบ'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('เข้าสู่ระบบไม่สำเร็จ', 'รหัสผ่านไม่ถูกต้อง');
    });
  });
});

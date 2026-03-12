import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '../useAuth';
import { onAuthStateChanged } from 'firebase/auth';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(),
}));

jest.mock('../../firebaseConfig', () => ({
  auth: {},
}));

describe('useAuth', () => {
  it('should initialize with loading true and user null', () => {
    (onAuthStateChanged as jest.Mock).mockImplementation(() => jest.fn());
    
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('should update user and loading when auth state changes', () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    
    // Simulate auth state change
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn(); // unsubscribe function
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  it('should handle logout (user becomes null)', () => {
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(null);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});

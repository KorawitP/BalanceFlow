import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TransactionItem from '../TransactionItem';
import * as Haptics from 'expo-haptics';

// Mock Dependencies
jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

describe('TransactionItem', () => {
  const mockItem = {
    id: '1',
    title: 'Lunch',
    amount: 100,
    type: 'expense' as const,
    category: 'Food',
    date: new Date('2023-01-01'),
    createdAt: new Date(),
  };

  const mockOnPress = jest.fn();
  const mockOnLongPress = jest.fn();

  it('renders correctly for expense', () => {
    const { getByText } = render(
      <TransactionItem 
        item={mockItem} 
        onPress={mockOnPress} 
        onLongPress={mockOnLongPress} 
      />
    );

    expect(getByText('Lunch')).toBeTruthy();
    expect(getByText('อาหาร')).toBeTruthy(); // Category mapped to Thai
    expect(getByText('- 100.00')).toBeTruthy();
  });

  it('renders correctly for income', () => {
    const incomeItem = { ...mockItem, type: 'income' as const, amount: 5000 };
    const { getByText } = render(
      <TransactionItem 
        item={incomeItem} 
        onPress={mockOnPress} 
        onLongPress={mockOnLongPress} 
      />
    );

    expect(getByText('+ 5,000.00')).toBeTruthy();
  });

  it('handles press interactions', () => {
    const { getByText } = render(
      <TransactionItem 
        item={mockItem} 
        onPress={mockOnPress} 
        onLongPress={mockOnLongPress} 
      />
    );

    fireEvent.press(getByText('Lunch'));
    expect(mockOnPress).toHaveBeenCalledWith(mockItem);
  });

  it('handles long press interactions', () => {
    const { getByText } = render(
      <TransactionItem 
        item={mockItem} 
        onPress={mockOnPress} 
        onLongPress={mockOnLongPress} 
      />
    );

    fireEvent(getByText('Lunch'), 'onLongPress');
    expect(Haptics.impactAsync).toHaveBeenCalled();
    expect(mockOnLongPress).toHaveBeenCalledWith(mockItem.id);
  });
});

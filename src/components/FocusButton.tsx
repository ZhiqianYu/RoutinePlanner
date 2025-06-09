// src/components/FocusButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface FocusButtonProps {
  onPress: () => void;
  isVisible: boolean;
}

export const FocusButton: React.FC<FocusButtonProps> = ({ onPress, isVisible }) => {
  if (!isVisible) return null;

  return (
    <TouchableOpacity style={styles.focusButton} onPress={onPress}>
      <Text style={styles.focusButtonIcon}>👁️‍🗨️</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  focusButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },
  focusButtonIcon: {
    fontSize: 24,
    textAlign: 'center',
  },
});
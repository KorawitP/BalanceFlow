import React, { useState } from 'react';
import { View, Button, Text, Alert, StyleSheet } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function TestFirebase() {
  const [status, setStatus] = useState('..Ready..');

  const addData = async () => {
    setStatus('Sending...');
    try {
      const docRef = await addDoc(collection(db, "test_collection"), {
        message: "Hello form React Native!",
        timestamp: new Date()
      });
      setStatus('Success! ID: ' + docRef.id);
      Alert.alert("Success", "Data saved with ID: " + docRef.id);
    } catch (e: any) {
      console.error("Error adding document: ", e);
      setStatus('Error: ' + e.message);
      Alert.alert("Error", "Check console for details");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Status: {status}</Text>
      <Button title="Test Write to Firestore" onPress={addData} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    margin: 20,
    alignItems: 'center',
    width: '100%',
  },
  text: {
    marginBottom: 10,
    color: '#333',
    fontWeight: 'bold',
  }
});

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function CollectionScreen() {
  const [cards, setCards] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const fetchCards = async () => {
        try {
          const stored = await AsyncStorage.getItem('cards');
          const parsed = stored ? JSON.parse(stored) : [];
          setCards(parsed.reverse()); // newest first
        } catch (e) {
          console.error('Error loading cards:', e);
        }
      };

      fetchCards();
    }, [])
  );

  const renderCard = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUri }} style={styles.image} />
      <Text style={styles.caption}>{item.caption}</Text>
      <Text style={styles.meta}>{item.rarity} {item.isFullArt ? '• Full Art' : ''}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={cards}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderCard}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 10 },
  card: { marginBottom: 20, padding: 10, backgroundColor: '#eee', borderRadius: 10 },
  image: { width: '100%', height: 200, borderRadius: 10 },
  caption: { marginTop: 10, fontSize: 16, fontStyle: 'italic' },
  meta: { fontSize: 14, color: '#444' },
});

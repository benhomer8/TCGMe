import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet,
  Modal, TouchableOpacity, Dimensions, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 5;
const CARD_WIDTH = (width - CARD_MARGIN * 6) / 3; // for 3 cards per row

export default function CollectionScreen() {
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const fetchCards = async () => {
        try {
          const stored = await AsyncStorage.getItem('cards');
          const parsed = stored ? JSON.parse(stored) : [];
          setCards(parsed.reverse());
        } catch (e) {
          console.error('Error loading cards:', e);
        }
      };

      fetchCards();
    }, [])
  );

  const renderCard = ({ item }) => (
    <TouchableOpacity onPress={() => setSelectedCard(item)} style={styles.card}>
      <Image source={{ uri: item.imageUri }} style={styles.image} />
      <Text numberOfLines={2} style={styles.caption}>{item.caption}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={cards}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderCard}
        numColumns={3}
        contentContainerStyle={styles.list}
      />

      {/* Zoom Modal */}
      <Modal visible={!!selectedCard} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Image source={{ uri: selectedCard?.imageUri }} style={styles.modalImage} />
              <Text style={styles.modalCaption}>{selectedCard?.caption}</Text>
              <Text style={styles.modalMeta}>
                {selectedCard?.rarity} {selectedCard?.isFullArt ? '• Full Art' : ''}
              </Text>
            </ScrollView>
            <TouchableOpacity onPress={() => setSelectedCard(null)} style={styles.closeButton}>
              <Text style={{ color: '#fff' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  list: { padding: 10 },
  card: {
    width: CARD_WIDTH,
    margin: CARD_MARGIN,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 6,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 6,
    marginBottom: 4,
  },
  caption: {
    fontSize: 10,
    textAlign: 'center',
    color: '#333',
    marginBottom: 2,
  },
  meta: {
    fontSize: 9,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    marginBottom: 10,
  },
  modalCaption: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#222',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalMeta: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 6,
  },
});

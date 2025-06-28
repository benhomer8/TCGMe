import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet,
  Modal, TouchableOpacity, Dimensions, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import LogoSVG from './LogoSVG';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 5;
const CARD_WIDTH = (width - CARD_MARGIN * 6) / 3; // for 3 cards per row
const CARD_HEIGHT = CARD_WIDTH * 1.5; // assuming a 2:3 aspect ratio
const rainbowEffect = require('./assets/lottie_animations/rainbow_gradient.json');

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
      {item.isFoil && (
      <LottieView
          source={rainbowEffect}
          autoPlay = {false}
          style={styles.rainbowRareEffect}
        />
      )}
      <Text style={styles.name}>{item.name}</Text>
      <Image source={{ uri: item.imageUri }} style={styles.image} />
      <Text numberOfLines={3} style={styles.caption}>{item.caption}</Text>
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
              {selectedCard?.isFoil && (
              <LottieView
                  source={rainbowEffect}
                  autoPlay
                  loop
                  style={styles.rainbowRareEffect}
                />
              )}
              <Text style={[ 
                styles.name,{
                fontSize: 20,
                marginTop: '3%'
              }
            ]
              }>{selectedCard?.name}</Text>
              <Image source={{ uri: selectedCard?.imageUri }} style={styles.modalImage} />
              <Text numberOfLines={6} style={styles.modalCaption}>{selectedCard?.caption}</Text>
              <View>
                <Text style={styles.modalMeta}>
                  {selectedCard?.createdAt } 
                </Text>
              </View>
          </View>

          <TouchableOpacity onPress={() => setSelectedCard(null)} style={styles.closeButton}>
              <Text style={{ color: '#fff' }}>Close</Text>
            </TouchableOpacity>
            
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'grey' },
  list: { 
    alighItems: 'center',
    justifyContent: 'center'  // Center the cards in the list
  },
  card: {
    width: CARD_WIDTH,
    margin: CARD_MARGIN,
    height: CARD_HEIGHT,
    backgroundColor: '#FFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    overflow: 'hidden'
  },
  image: {
    width: '90%',
    height: '50%',
    borderRadius: 7,
    marginBottom: "4%",
    marginTop: '3%',
  },
  caption: {
    fontSize: 10,
    textAlign: 'center',
    color: '#333',
    marginTop: '5%',
    width: CARD_WIDTH - 12, // account for padding', 
    maxHeight: '40%',
  },
  name:{
    fontSize: 11,
    color: 'black',
    marginTop: '-10%',
    maxWidth: '95%',
    maxHeight: '10%',
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
    height: "60%",
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    overflow: 'hidden'
  },
  modalImage: {
    width: '90%',
    height: '50%',
    borderRadius: 7,
    marginBottom: "2%",
    marginTop: '2%',
  },
  modalCaption: {
    marginTop: '3%',
    fontSize: 16,
    fontStyle: 'italic',
    color: '#222',
    marginBottom: 6,
    textAlign: 'center',
    maxWidth: "90%",
    maxHeight: '30%'
  },
  modalMeta: {
    marginTop: '10%',
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    fontStyle: 'italic'
  },
  closeButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 6,
  },

  rainbowRareEffect: {
    opacity: 0.3, 
    width: '200%',
    height: '200%',
    position: 'absolute',
    overflow: 'hidden'
  },

});

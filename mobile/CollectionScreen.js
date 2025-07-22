import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet,
  Modal, TouchableOpacity, Dimensions, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import LogoSVG from './LogoSVG';
import BackgroundSVG from './BackgroundSVG'; 
import { FadeInRight } from 'react-native-reanimated';
import InteractiveCard from './InteractiveCard';


const { height: height, width: width } = Dimensions.get('window');
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
    <TouchableOpacity onPress={() => setSelectedCard({ ...item, isSelected: true })
      } style={[styles.card, { backgroundColor: item?.color || '#fff' }]}>
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
      <BackgroundSVG style ={{position: 'absolute', width: '200%', height: '100%' }}> </BackgroundSVG>
      
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
          
          
          <InteractiveCard
            selectedCard={selectedCard}
            CARD_HEIGHT={height * 0.6}
            CARD_WIDTH={width * 0.9}
            ></InteractiveCard>

          <TouchableOpacity onPress={() => setSelectedCard(null)} style={styles.closeButton}>
              <Text style={{ color: '#fff' }}>Close</Text>
            </TouchableOpacity>
            
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'grey', alignItems: 'center',
    justifyContent: 'center',},
  list: { 

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
    overflow: 'hidden',
    borderColor: 'grey',
    borderWidth:2,
    shadowColor: 'black',
    shadowOffset: 10,
    shadowOpacity: 10,
    shadowRadius: 20,
  },
  image: {
    width: '90%',
    height: '50%',
    borderRadius: 5,
    marginBottom: "4%",
    marginTop: '3%',
    borderColor: 'grey',
    borderWidth: 1,
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
    zIndex: 1,
  },
  modalContent: {
    width: '100%',
    height: "60%",
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    overflow: 'hidden',

  },
  modalImage: {
    width: '93%',
    height: '50%',
    borderRadius: 5,
    marginTop: '2%',
    borderColor: 'grey',
    borderWidth: 2,
  },
  modalCaption: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#222',
    marginBottom: 6,
    textAlign: 'center',
    maxWidth: "90%",
    
  },
  modalMeta: {
    marginTop: '10%',
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    fontStyle: 'italic',
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

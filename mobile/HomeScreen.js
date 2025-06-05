import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Button,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import Card from './Card';
import AsyncStorage from '@react-native-async-storage/async-storage';



const packImage = require('./assets/images/CardPack.png');
const screenHeight = Dimensions.get('window').height;

class HomeScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cards: [],
      currentIndex: 0,
      img: null,
      caption: '',
      loading: false,
      allPhotos: [],
      flyAnim: new Animated.Value(0),
      packOpening: true,
      packY: new Animated.Value(0),
    };
  }

  componentDidMount() {
    this.loadPhotos();
  }

  loadPhotos = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access media library is required!');
      return;
    }

    let allAssets = [];
    let hasNextPage = true;
    let after = null;

    while (hasNextPage) {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 100,
        after,
      });

      allAssets = [...allAssets, ...media.assets];
      hasNextPage = media.hasNextPage;
      after = media.endCursor;
    }

    this.setState({ allPhotos: allAssets });
  };


  packOpened = async () => {
    
    const { allPhotos } = this.state;
    if (allPhotos.length === 0) {
      alert('No photos found!');
      return;
    }

    this.setState({ loading: true, cards: [], currentIndex: 0,});

    const newCards = [];

    const amountPerPack = 5; // Number of cards per pack

    for (let i = 0; i < amountPerPack; i++) {
      try {
        const randomIndex = Math.floor(Math.random() * allPhotos.length);
        const selected = allPhotos[randomIndex];

        const assetInfo = await MediaLibrary.getAssetInfoAsync(selected.id);
        const imageUri = assetInfo.localUri || assetInfo.uri;

        const result = await manipulateAsync(
          imageUri,
          [],
          {
            compress: 0.3,
            format: SaveFormat.WEBP,
          }
        );

        const resizedUri = result.uri;

        const base64 = await FileSystem.readAsStringAsync(resizedUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const caption = await this.uploadBase64Image(base64);

        const card = new Card(imageUri, caption, {
          rarity: 'common',
          isFullArt: false,
        });

        card.setCardName();
        newCards.push(card);
        this.saveCard(card);

      } catch (error) {
        console.error('Error generating card:', error);
      }
    }

    this.setState({ cards: newCards, loading: false, currentIndex: 0 });
  };
  



  createCard = async () => {
    const { allPhotos } = this.state;
    if (allPhotos.length === 0) {
      alert('No photos found!');
      return;
    }

    this.setState({ loading: true, caption: '', img: null });

    try {
      const randomIndex = Math.floor(Math.random() * allPhotos.length);
      const selected = allPhotos[randomIndex];

      const assetInfo = await MediaLibrary.getAssetInfoAsync(selected.id);
      const imageUri = assetInfo.localUri || assetInfo.uri;

      const result = await manipulateAsync(
        imageUri,
        [],
        {
          compress: 0.3,
          format: SaveFormat.WEBP,
        }
      );

      const resizedUri = result.uri;

      const base64 = await FileSystem.readAsStringAsync(resizedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const caption = await this.uploadBase64Image(base64);

      

      const card = new Card(
        imageUri,
        caption,
        {
          rarity: "common",
          isFullArt: false,
        }
      );
      card.setCardName();

      const newCards = [...this.state.cards, card];

      this.setState({ cards: newCards, currentIndex: 0 });
      this.saveCard(card);
    } catch (error) {
      console.error(error);
      alert('Error selecting or processing image.');
      this.setState({ loading: false });
    }
  };

  uploadBase64Image = async (base64) => {
    try {
      const payload = {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Describe this image similar to a pokemon or yu-gi-oh in a short description following the format of Name of Card ---- Description make sure name of card comes first then 4 dashes(-) ---- into description' },
              { type: 'image_url', image_url: { url: `data:image/webp;base64,${base64}` } },
            ],
          },
        ],
      };

      const response = await fetch('http://192.168.1.12:5000/api/photo/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Upload failed: ${errText}`);
      }

      const json = await response.json();
      return json.caption;
    } catch (error) {
      console.error(error);
      alert('Failed to upload image or get caption.');
      return '';
    }
  };

  saveCard = async (newCard) => {
    try {
      const existing = await AsyncStorage.getItem('cards');
      const cards = existing ? JSON.parse(existing) : [];
      cards.push(newCard);
      await AsyncStorage.setItem('cards', JSON.stringify(cards));
      console.log('Card saved!');
    } catch (e) {
      console.error('Failed to save card:', e);
    }
  };

revealNextCard = () => {
  const { currentIndex, cards } = this.state;

  if (currentIndex < cards.length - 1) {
    Animated.timing(this.state.flyAnim, {
      toValue: -screenHeight,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      // Immediately move to the next card and reset animation
      this.setState(
        prev => ({
          currentIndex: prev.currentIndex + 1,
          flyAnim: new Animated.Value(0), // Reset instantly
        })
      );
    });
  }else{
    this.setState({ packOpening: false, cards: [] });
  }
};

  animatePackOpen = () => {
    Animated.timing(this.state.packY, {
      toValue: -300, // move up by 300 pixels
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      // starts after animation
      this.setState({ packOpened: false, packY: new Animated.Value(0) }); // or trigger card reveal
      this.packOpened();
    });
  };

  render() {
  const { cards, currentIndex, loading, flyAnim, packOpening, packY } = this.state;

return (
  <View style={styles.container}>
  

  {packOpening && (
    <TouchableOpacity onPress={this.animatePackOpen}>
      <Animated.View style={{ transform: [{ translateY: packY }] }}>
        <Image
          source={packImage}
          style={{
          width: 200,
          height: 300,
          alignSelf: 'center',
          resizeMode: 'contain',
        }}
        />
      </Animated.View>
    </TouchableOpacity>
  )}
        
     

    {loading && (
      <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
    )}

    <View style={{ height: 400 }}>
      {cards.length > 0 && (
        <TouchableOpacity onPress={this.revealNextCard} activeOpacity={0.9}>
          <View style={{ position: 'relative', height: 400, alignItems: 'center'}}>
            {cards.map((card, index) => {
              if (index < currentIndex) return null; // Skip already revealed

              const isTopCard = index === currentIndex;

              const animatedStyle = isTopCard
                ? { transform: [{ translateY: flyAnim }] }
                : {};

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.card,
                    {
                      position: 'absolute',
                      zIndex: cards.length - index, // higher index = behind
                    },
                    animatedStyle,
                  ]}
                >
                  <Text style={styles.namePlaceholder}>{card.name || 'Card Name'}</Text>
                  <Image source={{ uri: card.imageUri }} style={styles.cardImage} />
                  <Text style={styles.caption}>{card.caption}</Text>
                </Animated.View>
              );
            })}
          </View>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

}

}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    height: 400,
    width: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  caption: {
    fontSize: 14,
    color: '#333',
    marginTop: 10,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  namePlaceholder: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
});

export default HomeScreen;

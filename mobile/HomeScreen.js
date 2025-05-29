import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Button,
  Text,
  ActivityIndicator,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import Card from './Card'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

class HomeScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      img: null,
      caption: '',
      loading: false,
      allPhotos: [],
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

      

      this.setState(
        {
          img: { uri: resizedUri },
          caption: '',
        },
        () => {
          this.uploadBase64Image(base64);
        }
      );
      const {caption} = this.state;
      currentCard = new Card(resizedUri, caption, { rarity: 'common', isFullArt: false });
      this.saveCard(currentCard);

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
              { type: 'text', text: 'Describe this image similar to a pokemon or yu-gi-oh in a short description following the format of Name of Card ----- Description: make sure name of card comes first then ----- into description' },
              { type: 'image_url', image_url: { url: `data:image/webp;base64,${base64}` } },
            ],
          },
        ],
        
      };

      const response = await fetch('http://192.168.1.12:5000/api/photo/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Upload failed: ${errText}`);
      }

      const json = await response.json();
      this.setState({ caption: json.caption });
      return json.caption;
    } catch (error) {
      console.error(error);
      alert('Failed to upload image or get caption.');
    } finally {
      this.setState({ loading: false });
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
}

  render() {
    const { img, caption, loading } = this.state;

    return (
      <View style={styles.container}>
        {img && <Image style={styles.image} source={{ uri: img.uri }} />}
        <Button title="🎲 Get Random Image" onPress={this.createCard} />
        {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />}
        {caption !== '' && (
          <View style={styles.card}>
            <Text style={styles.cardText}>{caption}</Text>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  image: { width: 300, height: 300, resizeMode: 'cover', marginVertical: 20 },
  card: { marginTop: 20, padding: 15, backgroundColor: '#eee', borderRadius: 10 },
  cardText: { fontSize: 16, fontStyle: 'italic' },
});

export default HomeScreen;
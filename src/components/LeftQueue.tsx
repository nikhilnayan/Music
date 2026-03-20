import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { spacing, typography } from '../theme';

export const LeftQueue = () => {
  const { queue } = usePlayerStore();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>UP NEXT</Text>
      <FlatList
        data={queue}
        keyExtractor={(s) => s.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.empty}>Empty queue</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item}>
            <Image source={{ uri: item.artwork }} style={styles.art} />
            <View style={styles.content}>
               <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    height: '60%',
    position: 'absolute',
    left: 10,
    top: '20%',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  item: {
    marginBottom: 12,
    alignItems: 'center',
  },
  art: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  content: {
    marginTop: 4,
  },
  title: {
    color: '#fff',
    fontSize: 9,
    textAlign: 'center',
    width: 60,
  },
  empty: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 20,
  }
});

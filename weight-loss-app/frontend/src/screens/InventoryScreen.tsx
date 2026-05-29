import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, Modal, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton, TextInput, Button, FAB, ActivityIndicator, Chip } from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import { InventoryItem } from '../types';
import SteamBindPrompt from '../components/SteamBindPrompt';
import * as api from '../api';

const THEME_COLOR = '#1a73e8';

const RARITY_OPTIONS = ['消费级', '工业级', '军规级', '隐秘', '远古', '传说'];

const RARITY_COLORS: Record<string, string> = {
  消费级: '#b0c3d9',
  工业级: '#5e98d9',
  军规级: '#4b69ff',
  隐秘: '#8847ff',
  远古: '#eb4b4b',
  传说: '#e4ae39',
};

const WEAR_OPTIONS = ['全新', '崭新', '略磨', '久经', '破损', '战痕'];

const InventoryScreen: React.FC = () => {
  const { inventoryItems, isLoading, addItem, updateItem, removeItem, user } = useAppContext();

  const [steamInventoryLoading, setSteamInventoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchSteamInventory = async () => {
      if (user?.id && user?.steamId) {
        setSteamInventoryLoading(true);
        try {
          const data = await api.getSteamInventory(user.id);
          console.log('Steam 库存数据:', data);
        } catch (e: any) {
          const msg = e?.message || '获取 Steam 库存失败';
          setToastMessage(msg);
          setTimeout(() => setToastMessage(''), 3000);
        } finally {
          setSteamInventoryLoading(false);
        }
      }
    };
    fetchSteamInventory();
  }, [user?.id, user?.steamId]);

  if (!user?.steamId) {
    return (
      <SteamBindPrompt
        onBind={async () => {
          try {
            const url = await api.getSteamLoginUrl();
            window.location.href = url;
          } catch (e: any) {
            alert(e?.message || '获取Steam登录地址失败');
          }
        }}
      />
    );
  }
  const [modalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [editPriceVisible, setEditPriceVisible] = useState(false);
  const [editPrice, setEditPrice] = useState('');
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  const [formWeaponType, setFormWeaponType] = useState('');
  const [formSkinName, setFormSkinName] = useState('');
  const [formRarity, setFormRarity] = useState('');
  const [formWear, setFormWear] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formQuantity, setFormQuantity] = useState('1');

  const filteredItems = inventoryItems.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.weaponType.toLowerCase().includes(query) ||
      item.skinName.toLowerCase().includes(query)
    );
  });

  const resetForm = () => {
    setFormWeaponType('');
    setFormSkinName('');
    setFormRarity('');
    setFormWear('');
    setFormPrice('');
    setFormQuantity('1');
  };

  const handleAddItem = async () => {
    if (!formWeaponType.trim()) {
      Alert.alert('提示', '请输入武器类型');
      return;
    }
    if (!formSkinName.trim()) {
      Alert.alert('提示', '请输入皮肤名称');
      return;
    }
    if (!formRarity) {
      Alert.alert('提示', '请选择稀有度');
      return;
    }
    if (!formWear) {
      Alert.alert('提示', '请选择磨损度');
      return;
    }
    if (!formPrice || isNaN(parseFloat(formPrice)) || parseFloat(formPrice) <= 0) {
      Alert.alert('提示', '请输入有效的价格');
      return;
    }
    const qty = parseInt(formQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('提示', '请输入有效的数量');
      return;
    }

    setIsSaving(true);
    try {
      await addItem({
        weaponType: formWeaponType.trim(),
        skinName: formSkinName.trim(),
        rarity: formRarity,
        wear: formWear,
        price: parseFloat(formPrice),
        quantity: qty,
      });
      resetForm();
      setModalVisible(false);
      Alert.alert('成功', '物品已添加');
    } catch {
      Alert.alert('错误', '添加物品失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = (item: InventoryItem) => {
    Alert.alert(
      '确认删除',
      `确定要删除 ${item.weaponType} - ${item.skinName} 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeItem(item.id);
            } catch {
              Alert.alert('错误', '删除失败，请重试');
            }
          },
        },
      ],
    );
  };

  const handleOpenEditPrice = (item: InventoryItem) => {
    setEditItem(item);
    setEditPrice(item.price.toString());
    setEditPriceVisible(true);
  };

  const handleSavePrice = async () => {
    if (!editItem) return;
    const newPrice = parseFloat(editPrice);
    if (isNaN(newPrice) || newPrice <= 0) {
      Alert.alert('提示', '请输入有效的价格');
      return;
    }
    setIsUpdatingPrice(true);
    try {
      await updateItem(editItem.id, { price: newPrice });
      setEditPriceVisible(false);
      setEditItem(null);
    } catch {
      Alert.alert('错误', '更新价格失败，请重试');
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  const renderRarityBadge = (rarity: string) => {
    const color = RARITY_COLORS[rarity] || '#999';
    return (
      <Chip
        compact
        style={[styles.rarityBadge, { backgroundColor: `${color}20` }]}
        textStyle={[styles.rarityBadgeText, { color }]}
      >
        {rarity}
      </Chip>
    );
  };

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <Card style={styles.itemCard}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.weaponType}>{item.weaponType}</Text>
            <Text style={styles.skinName}>{item.skinName}</Text>
          </View>
          <IconButton
            icon="trash-can-outline"
            size={22}
            iconColor="#e53935"
            onPress={() => handleDeleteItem(item)}
          />
        </View>
        <View style={styles.itemDetails}>
          {renderRarityBadge(item.rarity)}
          <Chip compact style={styles.wearChip} textStyle={styles.wearChipText}>
            {item.wear}
          </Chip>
        </View>
        <View style={styles.itemFooter}>
          <TouchableOpacity
            style={styles.priceButton}
            onPress={() => handleOpenEditPrice(item)}
            activeOpacity={0.6}
          >
            <Text style={styles.priceLabel}>购入价</Text>
            <Text style={styles.price}>${item.price.toFixed(2)}</Text>
            <Text style={styles.priceHint}>点击编辑</Text>
          </TouchableOpacity>
          <Text style={styles.quantity}>x{item.quantity}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  if (isLoading && inventoryItems.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLOR} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="搜索武器或皮肤名称..."
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={setSearchQuery}
        mode="outlined"
        left={<TextInput.Icon icon="magnify" color="#666" />}
        right={
          searchQuery.length > 0 ? (
            <TextInput.Icon icon="close" color="#666" onPress={() => setSearchQuery('')} />
          ) : undefined
        }
        style={styles.searchBar}
        outlineColor="#ddd"
        activeOutlineColor={THEME_COLOR}
      />

      {filteredItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>
            {searchQuery ? '没有匹配的物品' : '库存为空'}
          </Text>
          <Text style={styles.emptyHint}>
            {searchQuery ? '尝试其他搜索关键词' : '点击右下角按钮添加物品'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {toastMessage ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}

      <FAB
        icon="plus"
        style={styles.fab}
        color="white"
        onPress={() => setModalVisible(true)}
        disabled={isSaving}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (!isSaving) {
            setModalVisible(false);
            resetForm();
          }
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>添加物品</Text>
            <IconButton
              icon="close"
              size={24}
              onPress={() => {
                if (!isSaving) {
                  setModalVisible(false);
                  resetForm();
                }
              }}
            />
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
            <TextInput
              label="武器类型"
              placeholder="例如: AK-47, M4A4, AWP"
              value={formWeaponType}
              onChangeText={setFormWeaponType}
              mode="outlined"
              style={styles.formInput}
              outlineColor="#ddd"
              activeOutlineColor={THEME_COLOR}
            />

            <TextInput
              label="皮肤名称"
              placeholder="例如: 二西莫夫, 龙王"
              value={formSkinName}
              onChangeText={setFormSkinName}
              mode="outlined"
              style={styles.formInput}
              outlineColor="#ddd"
              activeOutlineColor={THEME_COLOR}
            />

            <Text style={styles.sectionLabel}>稀有度</Text>
            <View style={styles.optionRow}>
              {RARITY_OPTIONS.map((rarity) => {
                const color = RARITY_COLORS[rarity];
                const isSelected = formRarity === rarity;
                return (
                  <Chip
                    key={rarity}
                    selected={isSelected}
                    onPress={() => setFormRarity(rarity)}
                    style={[
                      styles.optionChip,
                      isSelected && { backgroundColor: color },
                    ]}
                    textStyle={[
                      styles.optionChipText,
                      isSelected && { color: '#fff' },
                    ]}
                  >
                    {rarity}
                  </Chip>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>磨损度</Text>
            <View style={styles.optionRow}>
              {WEAR_OPTIONS.map((wear) => {
                const isSelected = formWear === wear;
                return (
                  <Chip
                    key={wear}
                    selected={isSelected}
                    onPress={() => setFormWear(wear)}
                    style={[
                      styles.optionChip,
                      isSelected && { backgroundColor: THEME_COLOR },
                    ]}
                    textStyle={[
                      styles.optionChipText,
                      isSelected && { color: '#fff' },
                    ]}
                  >
                    {wear}
                  </Chip>
                );
              })}
            </View>

            <TextInput
              label="价格 ($)"
              placeholder="0.00"
              value={formPrice}
              onChangeText={setFormPrice}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.formInput}
              outlineColor="#ddd"
              activeOutlineColor={THEME_COLOR}
            />

            <TextInput
              label="数量"
              placeholder="1"
              value={formQuantity}
              onChangeText={setFormQuantity}
              mode="outlined"
              keyboardType="number-pad"
              style={styles.formInput}
              outlineColor="#ddd"
              activeOutlineColor={THEME_COLOR}
            />

            <Button
              mode="contained"
              onPress={handleAddItem}
              loading={isSaving}
              disabled={isSaving}
              style={styles.submitBtn}
              buttonColor={THEME_COLOR}
            >
              {isSaving ? '添加中...' : '确认添加'}
            </Button>

            <Button
              mode="text"
              onPress={() => {
                setModalVisible(false);
                resetForm();
              }}
              disabled={isSaving}
              style={styles.cancelBtn}
              textColor="#666"
            >
              取消
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={editPriceVisible}
        animationType="fade"
        transparent
        onRequestClose={() => {
          if (!isUpdatingPrice) {
            setEditPriceVisible(false);
            setEditItem(null);
          }
        }}
      >
        <View style={styles.editOverlay}>
          <View style={styles.editDialog}>
            <Text style={styles.editDialogTitle}>修改购入价</Text>
            {editItem && (
              <Text style={styles.editItemName}>
                {editItem.weaponType} | {editItem.skinName}
              </Text>
            )}
            <TextInput
              label="购入价 ($)"
              placeholder="0.00"
              value={editPrice}
              onChangeText={setEditPrice}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.editPriceInput}
              outlineColor="#ddd"
              activeOutlineColor={THEME_COLOR}
              autoFocus
            />
            <View style={styles.editActions}>
              <Button
                mode="text"
                onPress={() => {
                  setEditPriceVisible(false);
                  setEditItem(null);
                }}
                disabled={isUpdatingPrice}
                textColor="#666"
                style={styles.editCancelBtn}
              >
                取消
              </Button>
              <Button
                mode="contained"
                onPress={handleSavePrice}
                loading={isUpdatingPrice}
                disabled={isUpdatingPrice}
                buttonColor={THEME_COLOR}
                style={styles.editSaveBtn}
              >
                {isUpdatingPrice ? '保存中...' : '确认'}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    margin: 12,
    marginBottom: 4,
    backgroundColor: '#fff',
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
    gap: 10,
  },
  itemCard: {
    backgroundColor: '#fff',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    marginRight: 4,
  },
  weaponType: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
  },
  skinName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 2,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  rarityBadge: {
    height: 28,
  },
  rarityBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  wearChip: {
    height: 28,
    backgroundColor: '#f0f0f0',
  },
  wearChipText: {
    fontSize: 12,
    color: '#666',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  priceButton: {
    alignItems: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderStyle: 'dashed',
  },
  priceLabel: {
    fontSize: 11,
    color: '#999',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME_COLOR,
  },
  priceHint: {
    fontSize: 10,
    color: '#bbb',
  },
  quantity: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 14,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: THEME_COLOR,
    borderRadius: 28,
  },
  toast: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 1000,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 4,
  },
  formInput: {
    backgroundColor: '#fff',
    marginTop: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 16,
    marginBottom: 6,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    backgroundColor: '#f0f0f0',
  },
  optionChipText: {
    fontSize: 13,
    color: '#444',
  },
  submitBtn: {
    marginTop: 24,
    paddingVertical: 4,
  },
  cancelBtn: {
    marginTop: 8,
  },
  editOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  editDialog: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  editDialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
  },
  editItemName: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  editPriceInput: {
    backgroundColor: '#fff',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 20,
  },
  editCancelBtn: {
    marginRight: 8,
  },
  editSaveBtn: {
    minWidth: 80,
  },
});

export default InventoryScreen;

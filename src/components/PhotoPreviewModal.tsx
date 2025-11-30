import * as ImageManipulator from "expo-image-manipulator";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// YENİ RENK PALETİ
const Colors = {
    background: '#0F172A', // Slate-900
    card: '#1E293B',       // Slate-800
    primary: '#3B82F6',     // Blue-500
    danger: '#F43F5E',      // Rose-500
    text: '#E2E8F0',        // Slate-200
    textSecondary: '#94A3B8',// Slate-400
    overlay: 'rgba(59, 130, 246, 0.4)', // Mavi şeffaf alan (Kırpma UI için)
};

// Kırpma için başlangıç oranları
const INITIAL_CROP_FACTOR = 0.4;
const INITIAL_ORIGIN_FACTOR = 0.3;
const STEP = 0.05;

interface PhotoPreviewModalProps {
  visible: boolean;
  imageUri: string | null;
  isAnalyzing: boolean; // App'ten gelen OCR analiz durumunu göstermek için
  onClose: () => void;
  onConfirm: (croppedBase64: string) => void;
}

export default function PhotoPreviewModal({
  visible,
  imageUri,
  isAnalyzing,
  onClose,
  onConfirm,
}: PhotoPreviewModalProps) {
  // Orijinal resim boyutunu saklamak için state
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  
  // Kırpma faktörleri için state
  const [cropHeightFactor, setCropHeightFactor] = useState(INITIAL_CROP_FACTOR);
  const [cropOriginFactor, setCropOriginFactor] = useState(INITIAL_ORIGIN_FACTOR);
  const [isProcessing, setIsProcessing] = useState(false); // Kırpma işlemi için local state

  // Modal açıldığında/resim değiştiğinde orijinal resim boyutunu al
  useEffect(() => {
    if (!imageUri || !visible) {
      setImageSize(null);
      setCropHeightFactor(INITIAL_CROP_FACTOR); // Oranları sıfırla
      setCropOriginFactor(INITIAL_ORIGIN_FACTOR);
      return;
    }

    Image.getSize(
      imageUri,
      (width, height) => setImageSize({ width, height }),
      (err) => console.log('Image.getSize error', err)
    );
  }, [imageUri, visible]);

  // Kırpma işlemini tetikleyen fonksiyon
  const handleConfirm = async () => {
    if (!imageUri || !imageSize || isProcessing) return;

    setIsProcessing(true);
    try {
      const { width: originalWidth, height: originalHeight } = imageSize;

      // Kullanıcının ayarladığı faktörlere göre piksel değerlerini hesapla
      const cropHeight = originalHeight * cropHeightFactor;
      const originY = originalHeight * cropOriginFactor;
      
      const actions: ImageManipulator.Action[] = [{
          crop: {
              originX: 0,
              originY: originY,
              width: originalWidth,
              height: cropHeight,
          },
      }];
      
      const manipulated = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        { base64: true, compress: 0.8 } 
      );

      if (manipulated.base64) {
          // Kırpılmış Base64'ü ana bileşene gönder
          onConfirm(manipulated.base64); 
      } else {
          throw new Error("Base64 dönüşümü başarısız.");
      }

    } catch (e) {
      console.log('Kırpma hatası', e);
      alert('Resim işlenirken bir hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Kırpma başlangıç noktasını (dikey konum) değiştirir
  const handleOriginChange = (delta: number) => {
      // 0 ile (1 - kırpma yüksekliği) arasında kalmasını sağla
      setCropOriginFactor(f => Math.max(0, Math.min(1 - cropHeightFactor, f + delta)));
  }

  // Kırpma yüksekliğini değiştirir
  const handleHeightChange = (delta: number) => {
      // %10 ile %90 arasında kalmasını sağla
      setCropHeightFactor(f => Math.max(0.1, Math.min(0.9, f + delta)));
  }
  
  // OCR analizi veya yerel kırpma işlemi sürüyorsa butonları devre dışı bırak
  const isDisabled = isProcessing || isAnalyzing;

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="fade"
    >
      <View style={styles.container}>
        <View style={styles.modalInner}>
            <Text style={styles.title}>Kırpma Alanını Ayarla</Text>

            {/* FOTOĞRAF ÖNİZLEME */}
            <View style={styles.previewWrapper}>
                <Image source={{ uri: imageUri || "" }} style={styles.preview} resizeMode="contain" />
                
                {/* KIRPMA GÖRSELLEŞTİRİCİSİ */}
                {imageSize && (
                    <View style={[
                        styles.cropOverlay, 
                        { 
                            height: `${cropHeightFactor * 100}%`,
                            top: `${cropOriginFactor * 100}%`
                        }
                    ]} 
                    pointerEvents="none" 
                    />
                )}
            </View>

            {/* --- MANUEL KONTROLLER --- */}
            <Text style={styles.infoText}>
                Mavi çerçeve, taranacak alanı gösterir.
            </Text>

            {/* 1. YÜKSEKLİK AYARI */}
            <Text style={styles.controlLabel}>
                Kırpma Yüksekliği: %{Math.round(cropHeightFactor * 100)}
            </Text>
            <View style={styles.controlRow}>
                <TouchableOpacity 
                    style={[styles.controlButton, { backgroundColor: Colors.card }]} 
                    onPress={() => handleHeightChange(-STEP)}
                    disabled={isDisabled || cropHeightFactor <= 0.1}
                >
                    <Text style={styles.controlButtonText}>- Daralt</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.controlButton, { backgroundColor: Colors.card }]} 
                    onPress={() => handleHeightChange(STEP)}
                    disabled={isDisabled || cropHeightFactor >= 0.9}
                >
                    <Text style={styles.controlButtonText}>+ Genişlet</Text>
                </TouchableOpacity>
            </View>

            {/* 2. BAŞLANGIÇ NOKTASI AYARI */}
            <Text style={styles.controlLabel}>
                Başlangıç Noktası (Yukarıdan): %{Math.round(cropOriginFactor * 100)}
            </Text>
            <View style={styles.controlRow}>
                <TouchableOpacity 
                    style={[styles.controlButton, { backgroundColor: Colors.card }]} 
                    onPress={() => handleOriginChange(-STEP)}
                    disabled={isDisabled || cropOriginFactor <= 0}
                >
                    <Text style={styles.controlButtonText}>▲ Yukarı Kaydır</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.controlButton, { backgroundColor: Colors.card }]} 
                    onPress={() => handleOriginChange(STEP)}
                    disabled={isDisabled || cropOriginFactor >= 1 - cropHeightFactor}
                >
                    <Text style={styles.controlButtonText}>▼ Aşağı Kaydır</Text>
                </TouchableOpacity>
            </View>
            {/* --- KONTROLLER BİTİŞİ --- */}

            {/* ONAY BUTONLARI */}
            <View style={styles.buttons}>
                <TouchableOpacity 
                    onPress={onClose} 
                    style={[styles.btn, { backgroundColor: Colors.danger }]}
                    disabled={isDisabled}
                >
                    <Text style={styles.text}>İptal</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={handleConfirm} 
                    style={[styles.btn, { backgroundColor: Colors.primary }]}
                    disabled={isDisabled}
                >
                    <Text style={styles.text}>
                        {isProcessing ? 'Kırpılıyor...' : (isAnalyzing ? 'Analiz Ediliyor...' : 'Kırp ve Tara')}
                    </Text>
                    {isDisabled && <ActivityIndicator color="#fff" style={{marginLeft: 5}} />}
                </TouchableOpacity>
            </View>
        </View>
      </View>
    </Modal>
  );
}

// --- STİLLER ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalInner: {
        width: "100%",
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 16,
        alignItems: "stretch",
    },
    title: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 10,
        textAlign: 'center',
    },
    previewWrapper: {
        width: "100%",
        height: 300, 
        borderRadius: 10,
        marginBottom: 10,
        overflow: 'hidden', 
        position: 'relative',
        backgroundColor: Colors.card,
    },
    preview: {
        width: "100%",
        height: "100%",
        position: 'absolute',
    },
    cropOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: Colors.overlay, 
        borderWidth: 2,
        borderColor: Colors.primary,
        borderStyle: 'dashed',
    },
    infoText: {
        color: Colors.textSecondary,
        fontSize: 12,
        marginBottom: 8,
        textAlign: 'center',
    },
    controlLabel: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
        marginBottom: 4,
    },
    controlRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 12,
    },
    controlButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: "center",
        borderColor: Colors.primary,
        borderWidth: 1,
    },
    controlButtonText: {
        color: Colors.text,
        fontWeight: "700",
    },
    buttons: {
        flexDirection: "row",
        marginTop: 12,
        width: "100%",
        gap: 10,
    },
    btn: {
        flex: 1,
        paddingVertical: 14, 
        borderRadius: 8,
        alignItems: "center",
        flexDirection: 'row',
        justifyContent: 'center',
    },
    text: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },
});
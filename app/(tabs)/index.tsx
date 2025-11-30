// app/(tabs)/index.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    LayoutChangeEvent,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { VisionBox, analyzeImageWithVision } from "../../src/vision";

// --- Tipler & sabitler ---
type Tile = { id: string; value: number };

const NUMBERS = Array.from({ length: 13 }, (_, i) => i + 1);

const Colors = {
    background: "#0F172A",
    card: "#1E293B",
    primary: "#3B82F6",
    secondary: "#10B981",
    danger: "#F43F5E",
    text: "#E2E8F0",
    textSecondary: "#94A3B8",
    numberSelected: "#FACC15",
    tileBackground: "#FFFFFF",
    totalValue: "#FACC15",
};

type Mode = "main" | "camera" | "crop";

export default function App() {
    const [mode, setMode] = useState<Mode>("main");

    const [selectedNumber, setSelectedNumber] = useState<number>(1);
    const [tiles, setTiles] = useState<Tile[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const total = useMemo(
        () => tiles.reduce((sum, t) => sum + t.value, 0),
        [tiles]
    );

    // Kamera
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView | null>(null);

    // Crop için
    const [capturedUri, setCapturedUri] = useState<string | null>(null);
    const [cropBox, setCropBox] = useState<{
        startX: number;
        startY: number;
        endX: number;
        endY: number;
    } | null>(null);
    const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
    const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(
        null
    );

    // Çekilen / seçilen resmin gerçek boyutu (crop ekranında lazım)
    useEffect(() => {
        if (!capturedUri) {
            setImageSize(null);
            setCropBox(null);
            return;
        }

        Image.getSize(
            capturedUri,
            (width, height) => setImageSize({ width, height }),
            (err) => console.log("Image.getSize error:", err)
        );
    }, [capturedUri]);

    const onCropContainerLayout = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setContainerSize({ width, height });
    };

    // -----------------------------
    // Manuel taş işlemleri
    // -----------------------------
    const addTile = () => {
        setTiles((prev) => [
            ...prev,
            { id: `${Date.now()}-${Math.random()}`, value: selectedNumber },
        ]);
    };

    const clearTiles = () => setTiles([]);
    const removeTile = (id: string) =>
        setTiles((prev) => prev.filter((t) => t.id !== id));

    // -----------------------------
    // Vision -> tiles
    // -----------------------------
    const handleVisionResult = (boxes: VisionBox[]) => {
        if (!boxes || boxes.length === 0) {
            Alert.alert("Sonuç Bulunamadı", "Görüntüde 1–13 arası sayı tespit edilemedi.");
            return;
        }

        const newTiles: Tile[] = boxes.map((b) => ({
            id: b.id,
            value: b.value,
        }));

        setTiles(newTiles);
    };

const analyzeImage = async (uri: string) => {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const boxes = await analyzeImageWithVision(base64);
  handleVisionResult(boxes);
};




    // -----------------------------
    // Kamera aç (kendi ekranımızda)
    // -----------------------------
    const openCameraScreen = async () => {
        if (!permission || !permission.granted) {
            const perm = await requestPermission();
            if (!perm.granted) {
                Alert.alert("İzin gerekli", "Kamerayı kullanmak için izin vermen gerekiyor.");
                return;
            }
        }

        setCapturedUri(null);
        setCropBox(null);
        setMode("camera");
    };

    // Kamera ekranında “Fotoğraf çek ve kırpa geç”
    const captureFromCamera = async () => {
        try {
            if (!cameraRef.current) return;

            const photo = await cameraRef.current.takePictureAsync({
                quality: 1,
            });

            setCapturedUri(photo.uri);
            setMode("crop"); // Aynı ekranda şimdi resim donmuş halde, üstüne crop yapacağız
        } catch (err) {
            console.log("takePictureAsync error:", err);
            Alert.alert("Hata", "Fotoğraf çekilemedi.");
        }
    };

    // Galeriden al → doğrudan crop ekranına geç (kamera yok)
    const pickFromGallery = async () => {
        try {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
                Alert.alert("İzin gerekli", "Galeri izni vermen gerekiyor.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                quality: 1,
                allowsEditing: false,
            });

            if (!result.canceled) {
                setCapturedUri(result.assets[0].uri);
                setMode("crop");
            }
        } catch (err) {
            console.log("Galeri hatası:", err);
        }
    };

    // -----------------------------
    // CROP EKRANI (kamera ile aynı layout)
    // -----------------------------
    if (mode === "crop" && capturedUri) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.mainTitle}>Kırpılacak Alanı Seç</Text>
                <Text style={styles.sectionTitle}>
                    Az önce çektiğin kadraj burada donduruldu. Parmağınla basılı tutup sürükleyerek
                    istaka/taş bölgesini seç.
                </Text>

                <View
                    style={styles.cameraOrCropWrapper}
                    onLayout={onCropContainerLayout}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderGrant={(e) => {
                        const { locationX, locationY } = e.nativeEvent;
                        setCropBox({
                            startX: locationX,
                            startY: locationY,
                            endX: locationX,
                            endY: locationY,
                        });
                    }}
                    onResponderMove={(e) => {
                        const { locationX, locationY } = e.nativeEvent;
                        setCropBox((prev) =>
                            prev ? { ...prev, endX: locationX, endY: locationY } : null
                        );
                    }}
                >
                    <Image
                        source={{ uri: capturedUri }}
                        style={styles.cameraOrCropImage}
                        resizeMode="contain"
                    />

                    {cropBox && (
                        <View
                            pointerEvents="none"
                            style={{
                                position: "absolute",
                                left: Math.min(cropBox.startX, cropBox.endX),
                                top: Math.min(cropBox.startY, cropBox.endY),
                                width: Math.abs(cropBox.endX - cropBox.startX),
                                height: Math.abs(cropBox.endY - cropBox.startY),
                                borderWidth: 2,
                                borderColor: Colors.numberSelected,
                                backgroundColor: "rgba(250, 204, 21, 0.2)",
                            }}
                        />
                    )}
                </View>

                <View style={styles.bottomButtonsRow}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton, { flex: 1 }]}
                        onPress={() => {
                            setCapturedUri(null);
                            setCropBox(null);
                            setMode("camera"); // İstersen direkt kameraya geri dönsün
                        }}
                        disabled={isAnalyzing}
                    >
                        <Text style={styles.buttonText}>Geri (Kamera)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.primaryButton, { flex: 1 }]}
                        onPress={async () => {
                            if (!cropBox || !imageSize || !containerSize) {
                                Alert.alert("Uyarı", "Lütfen önce ekranda bir alan seç.");
                                return;
                            }

                            try {
                                setIsAnalyzing(true);

                                const { width: imgW, height: imgH } = imageSize;
                                const { width: contW, height: contH } = containerSize;

                                const scale = Math.min(contW / imgW, contH / imgH);
                                const displayedW = imgW * scale;
                                const displayedH = imgH * scale;

                                const offsetX = (contW - displayedW) / 2;
                                const offsetY = (contH - displayedH) / 2;

                                const clamp = (v: number, min: number, max: number) =>
                                    Math.max(min, Math.min(v, max));

                                const sx = clamp(
                                    Math.min(cropBox.startX, cropBox.endX),
                                    offsetX,
                                    offsetX + displayedW
                                );
                                const ex = clamp(
                                    Math.max(cropBox.startX, cropBox.endX),
                                    offsetX,
                                    offsetX + displayedW
                                );
                                const sy = clamp(
                                    Math.min(cropBox.startY, cropBox.endY),
                                    offsetY,
                                    offsetY + displayedH
                                );
                                const ey = clamp(
                                    Math.max(cropBox.startY, cropBox.endY),
                                    offsetY,
                                    offsetY + displayedH
                                );

                                const cropWView = ex - sx;
                                const cropHView = ey - sy;

                                if (cropWView < 5 || cropHView < 5) {
                                    setIsAnalyzing(false);
                                    Alert.alert("Uyarı", "Çok küçük bir alan seçtin.");
                                    return;
                                }

                                const originX = (sx - offsetX) / scale;
                                const originY = (sy - offsetY) / scale;
                                const cropWidth = cropWView / scale;
                                const cropHeight = cropHView / scale;

                                const result = await ImageManipulator.manipulateAsync(
                                    capturedUri,
                                    [
                                        {
                                            crop: {
                                                originX,
                                                originY,
                                                width: cropWidth,
                                                height: cropHeight,
                                            },
                                        },
                                    ],
                                    { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
                                );

                                await analyzeImage(result.uri);

                                setIsAnalyzing(false);
                                setCapturedUri(null);
                                setCropBox(null);
                                setMode("main");
                            } catch (err) {
                                console.log("Crop/Analyze error:", err);
                                setIsAnalyzing(false);
                                Alert.alert("Hata", "Kırpma veya analiz sırasında sorun oluştu.");
                            }
                        }}
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? (
                            <ActivityIndicator color={Colors.background} />
                        ) : (
                            <Text style={styles.buttonText}>Kırp & Tara</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {isAnalyzing && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingText}>Taşlar analiz ediliyor...</Text>
                    </View>
                )}
            </SafeAreaView>
        );
    }

    // -----------------------------
    // KAMERA EKRANI (live preview)
    // -----------------------------
    if (mode === "camera") {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.mainTitle}>Istakayı Kadraja Yerleştir</Text>
                <Text style={styles.sectionTitle}>
                    Şimdi kamera açık. Çektiğin bu ekranda kırpma yapacaksın, başka ekrana gitmeyecek.
                </Text>

                <View style={styles.cameraOrCropWrapper}>
                    {permission?.granted ? (
                        <CameraView
                            ref={cameraRef}
                            style={styles.cameraOrCropImage}
                            facing="back"
                        />
                    ) : (
                        <View style={styles.centerBox}>
                            <Text style={{ color: Colors.textSecondary }}>
                                Kamera izni verilmemiş.
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.bottomButtonsRow}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton, { flex: 1 }]}
                        onPress={() => setMode("main")}
                    >
                        <Text style={styles.buttonText}>Geri (Ana Ekran)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.secondaryButton, { flex: 1 }]}
                        onPress={captureFromCamera}
                    >
                        <Text style={styles.buttonText}>Fotoğraf Çek & Kırpmaya Geç</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // -----------------------------
    // ANA EKRAN
    // -----------------------------
    const renderTile = ({ item }: { item: Tile }) => (
        <TouchableOpacity
            style={styles.tileItem}
            onLongPress={() => removeTile(item.id)}
        >
            <Text style={styles.tileTextValue}>{item.value}</Text>
            <Text style={styles.tileText}>Taş</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.mainTitle}>Okey 101 Taş Toplayıcı</Text>

            {/* Manuel taş ekleme */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>1. Manuel Taş Ekle</Text>
                <View style={styles.numbersRow}>
                    {NUMBERS.map((n) => (
                        <TouchableOpacity
                            key={n}
                            style={[
                                styles.numberChip,
                                selectedNumber === n && styles.numberChipSelected,
                            ]}
                            onPress={() => setSelectedNumber(n)}
                        >
                            <Text
                                style={[
                                    styles.numberText,
                                    selectedNumber === n && styles.numberTextSelected,
                                ]}
                            >
                                {n}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.actionButton, styles.primaryButton]}
                    onPress={addTile}
                >
                    <Text style={styles.buttonText}>Taşı Ekle: {selectedNumber}</Text>
                </TouchableOpacity>
            </View>

            {/* Kamera & Galeri girişleri */}
            <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={openCameraScreen}
            >
                <Text style={styles.buttonText}>📷 Kameradan Tara (Aynı Ekranda Kırp)</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton, { marginTop: 8 }]}
                onPress={pickFromGallery}
            >
                <Text style={styles.buttonText}>🖼 Galeriden Tara (Crop + OCR)</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton, { marginTop: 8 }]}
                onPress={clearTiles}
                disabled={tiles.length === 0}
            >
                <Text style={styles.buttonText}>Tüm Taşları Temizle</Text>
            </TouchableOpacity>

            {/* Toplam & taş listesi */}
            <View style={styles.totalBar}>
                <Text style={styles.totalLabel}>Toplam Puan:</Text>
                <Text style={styles.totalValue}>{total}</Text>
            </View>

            <View style={[styles.card, { flex: 1, marginTop: 8 }]}>
                <Text style={styles.cardTitle}>2. Elindeki Taşlar</Text>
                {tiles.length === 0 ? (
                    <Text style={styles.emptyText}>
                        Henüz taş yok. Manuel ekleyebilir veya kameradan/galeriden analiz edebilirsin.
                    </Text>
                ) : (
                    <FlatList
                        data={tiles}
                        keyExtractor={(i) => i.id}
                        renderItem={renderTile}
                        numColumns={3}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

// -----------------------------
// STYLES
// -----------------------------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: Colors.text,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    card: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: Colors.text,
        marginBottom: 8,
    },
    numbersRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 8,
    },
    numberChip: {
        width: 40,
        height: 40,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: Colors.primary,
        justifyContent: "center",
        alignItems: "center",
        margin: 4,
    },
    numberChipSelected: {
        backgroundColor: Colors.primary,
    },
    numberText: {
        color: Colors.text,
    },
    numberTextSelected: {
        color: Colors.background,
        fontWeight: "800",
    },
    actionButton: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 6,
    },
    primaryButton: {
        backgroundColor: Colors.primary,
    },
    secondaryButton: {
        backgroundColor: Colors.secondary,
    },
    dangerButton: {
        backgroundColor: Colors.danger,
    },
    cancelButton: {
        backgroundColor: Colors.textSecondary,
    },
    buttonText: {
        color: Colors.background,
        fontWeight: "700",
        fontSize: 16,
    },
    totalBar: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    totalLabel: {
        color: Colors.textSecondary,
    },
    totalValue: {
        color: Colors.totalValue,
        fontSize: 22,
        fontWeight: "900",
    },
    tileItem: {
        backgroundColor: Colors.tileBackground,
        padding: 10,
        borderRadius: 8,
        margin: 4,
        flex: 1,
        alignItems: "center",
    },
    tileTextValue: {
        fontSize: 22,
        fontWeight: "900",
        color: Colors.primary,
    },
    tileText: {
        color: Colors.background,
    },
    emptyText: {
        color: Colors.textSecondary,
        fontStyle: "italic",
        marginTop: 4,
    },
    cameraOrCropWrapper: {
        flex: 1,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "black",
        marginTop: 12,
        marginBottom: 12,
    },
    cameraOrCropImage: {
        width: "100%",
        height: "100%",
    },
    bottomButtonsRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 12,
    },
    centerBox: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        color: Colors.text,
        marginTop: 8,
        fontSize: 16,
    },
});

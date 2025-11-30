// app/(tabs)/styles.ts
import { StyleSheet } from "react-native";

export const Colors = {
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

export const styles = StyleSheet.create({
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

import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../theme";

export function Marca({ ampla = false }: { ampla?: boolean }) {
    return (
        <View style={[styles.brand, ampla && styles.brandWide]}>
            <View aria-hidden style={[styles.mark, ampla && styles.markWide]}>
                <View style={[styles.column, styles.columnShort]} />
                <View style={[styles.column, styles.columnTall]} />
                <View style={[styles.column, styles.columnMiddle]} />
            </View>
            <Text style={[styles.name, ampla && styles.nameWide]}>Finanças Pessoais</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    brand: { flexDirection: "row", gap: 9, alignItems: "center" },
    brandWide: { alignItems: "flex-start", flexDirection: "column", gap: 16 },
    mark: { flexDirection: "row", alignItems: "flex-end", height: 20, gap: 3, paddingBottom: 3, borderBottomWidth: 1, borderColor: colors.accent },
    markWide: { transform: [{ scale: 1.35 }], transformOrigin: "bottom left" },
    column: { width: 4, backgroundColor: colors.accent },
    columnShort: { height: 6 },
    columnTall: { height: 15 },
    columnMiddle: { height: 10 },
    name: { color: colors.onDark, fontFamily: fonts.display, fontSize: 23, lineHeight: 26 },
    nameWide: { fontSize: 49, lineHeight: 49, maxWidth: 220 }
});

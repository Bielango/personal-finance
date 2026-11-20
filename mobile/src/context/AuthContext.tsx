import {
    PropsWithChildren,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";
import { cadastroRequest, loginRequest } from "../services/api";
import { deleteStorageItem, getStorageItem, setStorageItem } from "../services/storage";
import { Usuario } from "../types";

const TOKEN_KEY = "personal-finance.jwt";
const USER_KEY = "personal-finance.usuario";

interface AuthContextValue {
    token: string | null;
    usuario: Usuario | null;
    carregando: boolean;
    entrar(email: string, senha: string): Promise<void>;
    cadastrar(nome: string, email: string, senha: string): Promise<void>;
    sair(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
    const [token, setToken] = useState<string | null>(null);
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        async function carregarSessao() {
            try {
                const [tokenSalvo, usuarioSalvo] = await Promise.all([
                    getStorageItem(TOKEN_KEY),
                    getStorageItem(USER_KEY)
                ]);

                setToken(tokenSalvo);
                setUsuario(usuarioSalvo ? JSON.parse(usuarioSalvo) as Usuario : null);
            } catch {
                await Promise.all([
                    deleteStorageItem(TOKEN_KEY),
                    deleteStorageItem(USER_KEY)
                ]);
            } finally {
                setCarregando(false);
            }
        }

        void carregarSessao();
    }, []);

    const entrar = useCallback(async (email: string, senha: string) => {
        const resposta = await loginRequest(email, senha);
        await Promise.all([
            setStorageItem(TOKEN_KEY, resposta.token),
            setStorageItem(USER_KEY, JSON.stringify(resposta.usuario))
        ]);
        setToken(resposta.token);
        setUsuario(resposta.usuario);
    }, []);

    const cadastrar = useCallback(async (nome: string, email: string, senha: string) => {
        await cadastroRequest(nome, email, senha);
        await entrar(email, senha);
    }, [entrar]);

    const sair = useCallback(async () => {
        await Promise.all([
            deleteStorageItem(TOKEN_KEY),
            deleteStorageItem(USER_KEY)
        ]);
        setToken(null);
        setUsuario(null);
    }, []);

    const value = useMemo(
        () => ({ token, usuario, carregando, entrar, cadastrar, sair }),
        [token, usuario, carregando, entrar, cadastrar, sair]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
    return context;
}

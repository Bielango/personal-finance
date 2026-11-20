export interface Usuario {
    id: number;
    nome: string;
    email: string;
}

export interface LoginResponse {
    token: string;
    usuario: Usuario;
}

export interface ApiValidationError {
    campo: string;
    mensagem: string;
}

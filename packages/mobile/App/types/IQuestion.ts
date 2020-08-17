export interface IQuestion {
    id: number
    text: string;
    type: string;
    options?: {
        label: string;
        value: string;
    }
    required?: boolean;
}

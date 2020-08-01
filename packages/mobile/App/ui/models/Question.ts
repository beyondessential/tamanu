export interface QuestionModel {
    id: number
    text: string;
    type: string;
    options?: {
        label: string;
        value: string;
    }
    required?: boolean;
}

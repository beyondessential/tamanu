export interface QuestionModel {
    id: number
    type: string
    label: string
    options?: {
        label: string;
        value: string;
    }
    required?: boolean;
}

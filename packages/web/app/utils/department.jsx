import React from "react";
import { TranslatedReferenceData } from "../components/Translation";

export const getDepartmentName = ({ department }) => (
    department
        ? <TranslatedReferenceData fallback={department.name} value={department.id} category="department" />
        : 'Unknown'
);

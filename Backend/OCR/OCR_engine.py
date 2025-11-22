
def gen_patient_info(filename):
    return {
        "patientInfo": {
            "name": "John Doe",
            "age": 45,
            "gender": "Male",
            "patientId": "PT-2024-001234",
            "testDate": "2024-11-20",
            "sourceFilename": filename

        }
    }

def gen_labor_data(filename):
    return {
            "laboratory": {
                "name": "Advanced Diagnostics Lab",
                "address": "123 Medical Center Dr, Healthcare City",
                "certificationId": "LAB-CERT-2024"
        }   }

def make_mock_data(filename):
    patient_info = gen_patient_info(filename)["patientInfo"]
    laboratory = gen_labor_data(filename)["laboratory"]

    MOCK_DATA = {
        "patientInfo": patient_info,
        "testResults": [
            {
                "parameter": "Hemoglobin",
                "value": 14.5,
                "unit": "g/dL",
                "referenceRange": "13.5-17.5",
                "status": "normal"
            },
            {
                "parameter": "White Blood Cell Count",
                "value": 7.2,
                "unit": "×10³/μL",
                "referenceRange": "4.5-11.0",
                "status": "normal"
            },
            {
                "parameter": "Platelet Count",
                "value": 245,
                "unit": "×10³/μL",
                "referenceRange": "150-400",
                "status": "normal"
            },
            {
                "parameter": "Red Blood Cell Count",
                "value": 4.8,
                "unit": "×10⁶/μL",
                "referenceRange": "4.5-5.5",
                "status": "normal"
            },
            {
                "parameter": "Hematocrit",
                "value": 43.2,
                "unit": "%",
                "referenceRange": "38.0-50.0",
                "status": "normal"
            },
            {
                "parameter": "Mean Corpuscular Volume",
                "value": 88,
                "unit": "fL",
                "referenceRange": "80-100",
                "status": "normal"
            },
            {
                "parameter": "Neutrophils",
                "value": 62,
                "unit": "%",
                "referenceRange": "40-70",
                "status": "normal"
            },
            {
                "parameter": "Lymphocytes",
                "value": 28,
                "unit": "%",
                "referenceRange": "20-40",
                "status": "normal"
            },
            {
                "parameter": "Glucose",
                "value": 105,
                "unit": "mg/dL",
                "referenceRange": "70-100",
                "status": "high"
            },
            {
                "parameter": "Total Cholesterol",
                "value": 198,
                "unit": "mg/dL",
                "referenceRange": "<200",
                "status": "normal"
            },
            {
                "parameter": "Total Fucker",
                "value": 198,
                "unit": "mg/dL",
                "referenceRange": "<200",
                "status": "normal"
            },

        ],
        "laboratory": laboratory

    }

    return MOCK_DATA
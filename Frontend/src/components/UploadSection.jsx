import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ResultsDisplay from '@/components/ResultsDisplay';

const UploadSection = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const { toast } = useToast();

  const mockBloodTestData = {
    patientInfo: {
      name: "John Doe",
      age: 45,
      gender: "Male",
      patientId: "PT-2024-001234",
      testDate: "2024-11-20"
    },
    testResults: [
      {
        parameter: "Hemoglobin",
        value: 14.5,
        unit: "g/dL",
        referenceRange: "13.5-17.5",
        status: "normal"
      },
      {
        parameter: "White Blood Cell Count",
        value: 7.2,
        unit: "×10³/μL",
        referenceRange: "4.5-11.0",
        status: "normal"
      },
      {
        parameter: "Platelet Count",
        value: 245,
        unit: "×10³/μL",
        referenceRange: "150-400",
        status: "normal"
      },
      {
        parameter: "Red Blood Cell Count",
        value: 4.8,
        unit: "×10⁶/μL",
        referenceRange: "4.5-5.5",
        status: "normal"
      },
      {
        parameter: "Hematocrit",
        value: 43.2,
        unit: "%",
        referenceRange: "38.0-50.0",
        status: "normal"
      },
      {
        parameter: "Mean Corpuscular Volume",
        value: 88,
        unit: "fL",
        referenceRange: "80-100",
        status: "normal"
      },
      {
        parameter: "Neutrophils",
        value: 62,
        unit: "%",
        referenceRange: "40-70",
        status: "normal"
      },
      {
        parameter: "Lymphocytes",
        value: 28,
        unit: "%",
        referenceRange: "20-40",
        status: "normal"
      },
      {
        parameter: "Glucose",
        value: 105,
        unit: "mg/dL",
        referenceRange: "70-100",
        status: "high"
      },
      {
        parameter: "Total Cholesterol",
        value: 198,
        unit: "mg/dL",
        referenceRange: "<200",
        status: "normal"
      }
    ],
    laboratory: {
      name: "Advanced Diagnostics Lab",
      address: "123 Medical Center Dr, Healthcare City",
      certificationId: "LAB-CERT-2024"
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, JPG, or PNG file.",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
    processDocument(file);
  };

  const processDocument = (file) => {
    setIsProcessing(true);
    setProcessedData(null);

    // Simulate OCR processing
    setTimeout(() => {
      setProcessedData(mockBloodTestData);
      setIsProcessing(false);
      toast({
        title: "Document processed successfully",
        description: `Extracted data from ${file.name}`,
      });
    }, 2500);
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setProcessedData(null);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-lg p-8"
      >
        <h2 className="text-2xl font-semibold text-blue-900 mb-6">Upload Blood Test Document</h2>
        
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-blue-300 bg-blue-50/30 hover:bg-blue-50/50'
          }`}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
          />
          
          <AnimatePresence mode="wait">
            {!uploadedFile ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-center">
                  <Upload className="w-16 h-16 text-blue-500" />
                </div>
                <div>
                  <p className="text-lg font-medium text-blue-900 mb-2">
                    Drag and drop your document here
                  </p>
                  <p className="text-sm text-blue-600 mb-4">
                    or click to browse
                  </p>
                  <label htmlFor="file-upload">
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                      <span>Select File</span>
                    </Button>
                  </label>
                  <p className="text-xs text-blue-500 mt-4">
                    Supported formats: PDF, JPG, PNG
                  </p>
                </div>
              </motion.div>
            ) : isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-center">
                  <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                </div>
                <div>
                  <p className="text-lg font-medium text-blue-900 mb-2">
                    Processing document...
                  </p>
                  <p className="text-sm text-blue-600">
                    Extracting blood test data using OCR
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                </div>
                <div>
                  <p className="text-lg font-medium text-blue-900 mb-2">
                    Document processed successfully
                  </p>
                  <p className="text-sm text-blue-600 mb-4">
                    {uploadedFile.name}
                  </p>
                  <Button 
                    onClick={resetUpload}
                    variant="outline"
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    Upload Another Document
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center gap-6 justify-center text-sm text-blue-600">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <span>PDF</span>
          </div>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            <span>JPG/PNG</span>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {processedData && (
          <ResultsDisplay data={processedData} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadSection;
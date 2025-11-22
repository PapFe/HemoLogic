import React from 'react';
import { Helmet } from 'react-helmet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UploadSection from '@/components/UploadSection';
import AdminModule from '@/components/AdminModule';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <>
      <Helmet>
        <title>HemoLogic - Blood Test Document Processing</title>
        <meta name="description" content="Professional blood test document processing platform with OCR capabilities for healthcare providers" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-3">
              HemoLogic
            </h1>
            <p className="text-lg text-blue-700">
              Blood Test Document Processing Platform
            </p>
          </header>

          <Tabs defaultValue="upload" className="w-full max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="upload">Document Upload</TabsTrigger>
              <TabsTrigger value="admin">Admin Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload">
              <UploadSection />
            </TabsContent>
            
            <TabsContent value="admin">
              <AdminModule />
            </TabsContent>
          </Tabs>
        </div>
        <Toaster />
      </div>
    </>
  );
}

export default App;
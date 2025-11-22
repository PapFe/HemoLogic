
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Key, Server, Shield, Send, Database, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const AdminModule = () => {
  const [ocrEndpoint, setOcrEndpoint] = useState('https://api.hemologic.com/v1/ocr');
  const [agentEndpoint, setAgentEndpoint] = useState('https://api.hemologic.com/v1/agent');
  const [sendToEndpoint, setSendToEndpoint] = useState('https://api.hemologic.com/v1/send-to');
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  const handleSave = () => {
    if (!ocrEndpoint || !agentEndpoint || !sendToEndpoint) {
      toast({
        title: "Validation Error",
        description: "All API Endpoints are required.",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('hemologic_ocr_endpoint', ocrEndpoint);
    localStorage.setItem('hemologic_agent_endpoint', agentEndpoint);
    localStorage.setItem('hemologic_sendto_endpoint', sendToEndpoint);
    localStorage.setItem('hemologic_api_key', apiKey);

    toast({
      title: "Settings saved successfully",
      description: "Your API configuration has been updated.",
    });
  };

  const handleReset = () => {
    setOcrEndpoint('https://api.hemologic.com/v1/ocr');
    setAgentEndpoint('https://api.hemologic.com/v1/agent');
    setSendToEndpoint('https://api.hemologic.com/v1/send-to');
    setApiKey('');
    
    localStorage.removeItem('hemologic_ocr_endpoint');
    localStorage.removeItem('hemologic_agent_endpoint');
    localStorage.removeItem('hemologic_sendto_endpoint');
    localStorage.removeItem('hemologic_api_key');

    toast({
      title: "Settings reset",
      description: "Configuration has been reset to defaults.",
    });
  };

  useEffect(() => {
    const savedOcr = localStorage.getItem('hemologic_ocr_endpoint');
    const savedAgent = localStorage.getItem('hemologic_agent_endpoint');
    const savedSendTo = localStorage.getItem('hemologic_sendto_endpoint');
    const savedApiKey = localStorage.getItem('hemologic_api_key');

    if (savedOcr) setOcrEndpoint(savedOcr);
    if (savedAgent) setAgentEndpoint(savedAgent);
    if (savedSendTo) setSendToEndpoint(savedSendTo);
    if (savedApiKey) setApiKey(savedApiKey);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-semibold text-blue-900">Admin Settings</h2>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">System Configuration</h3>
          </div>
          <p className="text-sm text-blue-700">
            Configure the endpoints for the document processing pipeline. These settings are stored locally.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ocr-endpoint" className="text-blue-900 font-medium flex items-center gap-2">
              <Server className="w-4 h-4" />
              OCR API Endpoint
            </Label>
            <Input
              id="ocr-endpoint"
              type="url"
              value={ocrEndpoint}
              onChange={(e) => setOcrEndpoint(e.target.value)}
              placeholder="https://api.hemologic.com/v1/ocr"
              className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-xs text-blue-500">Handles document text extraction</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-endpoint" className="text-blue-900 font-medium flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Agent API Endpoint
            </Label>
            <Input
              id="agent-endpoint"
              type="url"
              value={agentEndpoint}
              onChange={(e) => setAgentEndpoint(e.target.value)}
              placeholder="https://api.hemologic.com/v1/agent"
              className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-xs text-blue-500">Handles AI analysis and interpretation</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sendto-endpoint" className="text-blue-900 font-medium flex items-center gap-2">
              <Send className="w-4 h-4" />
              SendTo API Endpoint
            </Label>
            <Input
              id="sendto-endpoint"
              type="url"
              value={sendToEndpoint}
              onChange={(e) => setSendToEndpoint(e.target.value)}
              placeholder="https://api.hemologic.com/v1/send-to"
              className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-xs text-blue-500">Destination for processed data export</p>
          </div>

          <div className="space-y-2 pt-4 border-t border-blue-100">
            <Label htmlFor="api-key" className="text-blue-900 font-medium flex items-center gap-2">
              <Key className="w-4 h-4" />
              Master API Key
            </Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your secure API key"
              className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
          <Button 
            onClick={handleReset}
            variant="outline"
            className="border-blue-500 text-blue-600 hover:bg-blue-50 flex-1"
          >
            Reset to Defaults
          </Button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mt-6 text-xs text-gray-500 font-mono">
          <div className="flex items-center gap-2 mb-2 font-semibold text-gray-700">
            <Database className="w-3 h-3" />
            Current Config State
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-1">
            <span>OCR:</span> <span className="truncate">{ocrEndpoint}</span>
            <span>Agent:</span> <span className="truncate">{agentEndpoint}</span>
            <span>SendTo:</span> <span className="truncate">{sendToEndpoint}</span>
            <span>Auth:</span> <span>{apiKey ? '••••••••' : '(Empty)'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminModule;

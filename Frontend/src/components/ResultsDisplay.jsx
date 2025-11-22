
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileJson, Table, Download, Copy, CheckCircle2, AlertCircle, Sparkles, BrainCircuit, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const formatLabel = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')          // split camelCase: patientId -> patient Id
    .replace(/_/g, ' ')                  // snake_case -> snake case
    .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize each word
};


const ResultsDisplay = ({ data }) => {
  const [viewMode, setViewMode] = useState('table');
  const [showChat, setShowChat] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [fullAnalysisText, setFullAnalysisText] = useState('');
  const chatContainerRef = useRef(null);
  const { toast } = useToast();


  useEffect(() => {
    if (showChat && isStreaming) {
      if (streamedText.length < fullAnalysisText.length) {
        const timeout = setTimeout(() => {
          setStreamedText(fullAnalysisText.slice(0, streamedText.length + 1));
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 25); // Typing speed
        return () => clearTimeout(timeout);
      } else {
        setIsStreaming(false);
      }
    }
  }, [showChat, isStreaming, streamedText, fullAnalysisText]);

  /*
  const startAnalysis = () => {
    if (!showChat) {
      setShowChat(true);
      setIsStreaming(true);
      setStreamedText('');
    }
  };
*/
  const startAnalysis = async () => {
  if (showChat) return; // avoid double clicks

  try {
    setShowChat(true);
    setStreamedText('');
    setFullAnalysisText('');
    setIsStreaming(false);
    const endpoint = localStorage.getItem("hemologic_agent_endpoint")
    // Call your Flask endpoint
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // optionally send current data if you want later:
      // body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const json = await response.json();
    const text = json.analysis || "No analysis text received.";
    setFullAnalysisText(text);

    // 2) now start streaming
    setIsStreaming(true);

  } catch (error) {
    console.error("Analysis API error:", error);
    setIsStreaming(false);
    setStreamedText("Failed to load analysis from server.");

    toast({
      title: "Analysis failed",
      description: error.message,
      variant: "destructive",
    });
  }
};


  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast({
      title: "Copied to clipboard",
      description: "JSON data has been copied to your clipboard.",
    });
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blood-test-${data.patientInfo.patientId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "JSON file is being downloaded.",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal':
        return 'text-green-600 bg-green-50';
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'low':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'normal':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg shadow-lg p-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-blue-900">Extracted Results</h2>
        
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setViewMode('table')}
            variant={viewMode === 'table' ? 'default' : 'outline'}
            className={viewMode === 'table' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-500 text-blue-600 hover:bg-blue-50'}
          >
            <Table className="w-4 h-4 mr-2" />
            Table View
          </Button>
          <Button
            onClick={() => setViewMode('json')}
            variant={viewMode === 'json' ? 'default' : 'outline'}
            className={viewMode === 'json' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-500 text-blue-600 hover:bg-blue-50'}
          >
            <FileJson className="w-4 h-4 mr-2" />
            JSON View
          </Button>
          <Button
            onClick={copyToClipboard}
            variant="outline"
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button
            onClick={downloadJSON}
            variant="outline"
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {viewMode === 'table' ? (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Patient Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(data.patientInfo || {}).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm text-blue-600 font-medium">
                        {formatLabel(key)}
                      </p>
                      <p className="text-blue-900">
                        {String(value)}
                      </p>
                    </div>
                ))}
              </div>
            </div>


            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Test Results</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="px-4 py-3 text-left font-semibold">Parameter</th>
                    <th className="px-4 py-3 text-left font-semibold">Value</th>
                    <th className="px-4 py-3 text-left font-semibold">Unit</th>
                    <th className="px-4 py-3 text-left font-semibold">Reference Range</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                  </tr>
                  </thead>
                  <tbody>
                  {data.testResults.map((result, index) => (
                      <motion.tr
                          key={index}
                          initial={{opacity: 0, x: -20}}
                          animate={{opacity: 1, x: 0}}
                          transition={{duration: 0.3, delay: index * 0.05}}
                          className={`border-b border-blue-100 hover:bg-blue-50 transition-colors ${
                              index % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'
                          }`}
                      >
                        <td className="px-4 py-3 font-medium text-blue-900">{result.parameter}</td>
                        <td className="px-4 py-3 text-blue-800">{result.value}</td>
                        <td className="px-4 py-3 text-blue-700">{result.unit}</td>
                        <td className="px-4 py-3 text-blue-700">{result.referenceRange}</td>
                        <td className="px-4 py-3">
                        <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(result.status)}`}>
                          {getStatusIcon(result.status)}
                          {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                        </span>
                        </td>
                      </motion.tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center w-full">
              {!showChat && (
                  <Button
                      onClick={startAnalysis}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 h-auto text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                  >
                    <Sparkles className="w-5 h-5 mr-2 animate-pulse"/>
                    Vérkép elemzés
                  </Button>
              )}

              <AnimatePresence>
                {showChat && (
                    <motion.div
                        initial={{opacity: 0, height: 0}}
                        animate={{opacity: 1, height: 'auto'}}
                        exit={{opacity: 0, height: 0}}
                        className="w-full max-w-3xl mt-4 overflow-hidden"
                    >
                      <div className="bg-indigo-50 rounded-xl border border-indigo-100 shadow-inner overflow-hidden">
                        <div className="bg-indigo-100 px-4 py-3 flex items-center gap-2 border-b border-indigo-200">
                          <Bot className="w-5 h-5 text-indigo-700"/>
                          <span className="font-semibold text-indigo-900">AI Medical Assistant</span>
                          {isStreaming &&
                              <span className="ml-auto text-xs text-indigo-600 animate-pulse">Thinking...</span>}
                        </div>

                        <div
                            ref={chatContainerRef}
                            className="p-6 h-[300px] overflow-y-auto font-mono text-sm leading-relaxed text-indigo-900 whitespace-pre-wrap"
                        >
                          {streamedText}
                          {isStreaming && <span
                              className="inline-block w-2 h-4 ml-1 bg-indigo-500 animate-pulse align-middle"></span>}
                        </div>
                      </div>

                      <div className="mt-2 text-center">
                        <p className="text-xs text-gray-500 italic">
                          Disclaimer: This does not constitute professional medical advice. Content is AI-generated.
                        </p>
                      </div>
                    </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
      ) : (
          <div className="bg-blue-900 rounded-lg p-6 overflow-x-auto">
          <pre className="text-sm text-blue-100 font-mono">
            {JSON.stringify(data, null, 2)}
          </pre>
          </div>
      )}
    </motion.div>
  );
};

export default ResultsDisplay;

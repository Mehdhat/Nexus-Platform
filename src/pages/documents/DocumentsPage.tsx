import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { FileText, Upload, Download, Trash2, Share2, PenTool } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

import { useAuth } from '../../context/AuthContext';
import { createDealDocument, deleteDealDocument, getDealDocuments, saveDocumentSignature, updateDealDocumentStatus, upsertDealDocument } from '../../data/documentChamber';
import { DealDocument, DocumentStatus } from '../../types';

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DealDocument[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const selectedDoc = useMemo(() => {
    if (!selectedId) return null;
    return documents.find(d => d.id === selectedId) || null;
  }, [documents, selectedId]);

  const refresh = () => {
    const docs = getDealDocuments();
    setDocuments(docs);
    if (docs.length > 0 && !selectedId) {
      setSelectedId(docs[0].id);
    }
    if (selectedId && !docs.some(d => d.id === selectedId)) {
      setSelectedId(docs[0]?.id || null);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDrop = async (acceptedFiles: File[]) => {
    if (!user) return;
    if (acceptedFiles.length === 0) return;

    try {
      const created = await createDealDocument({ file: acceptedFiles[0], ownerId: user.id });
      toast.success('Document uploaded');
      refresh();
      setSelectedId(created.id);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    noClick: true,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': [],
      'text/plain': ['.txt'],
    },
  });

  const statusVariant = (status: DocumentStatus) => {
    if (status === 'draft') return 'gray' as const;
    if (status === 'in_review') return 'warning' as const;
    return 'success' as const;
  };

  const statusLabel = (status: DocumentStatus) => {
    if (status === 'draft') return 'Draft';
    if (status === 'in_review') return 'In Review';
    return 'Signed';
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const ensureCanvasSize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const nextWidth = Math.max(1, Math.floor(rect.width * dpr));
    const nextHeight = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 2 * dpr;
    }
  };

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    return {
      x: (e.clientX - rect.left) * dpr,
      y: (e.clientY - rect.top) * dpr,
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    ensureCanvasSize();
    const p = getCanvasPoint(e);
    if (!p) return;
    drawingRef.current = true;
    lastPointRef.current = p;
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const p = getCanvasPoint(e);
    const last = lastPointRef.current;
    if (!p || !last) return;

    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPointRef.current = p;
  };

  const endDraw = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const saveSignature = () => {
    if (!selectedDoc) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    ensureCanvasSize();
    const dataUrl = canvas.toDataURL('image/png');

    const updated = saveDocumentSignature(selectedDoc.id, dataUrl);
    if (!updated) {
      toast.error('Could not save signature');
      return;
    }
    toast.success('Signed');
    refresh();
  };

  const setStatus = (next: DocumentStatus) => {
    if (!selectedDoc) return;
    const updated = updateDealDocumentStatus(selectedDoc.id, next);
    if (!updated) {
      toast.error('Could not update status');
      return;
    }
    toast.success('Status updated');
    refresh();
  };

  const downloadSelected = () => {
    if (!selectedDoc?.dataUrl) return;
    const a = document.createElement('a');
    a.href = selectedDoc.dataUrl;
    a.download = selectedDoc.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const deleteSelected = () => {
    if (!selectedDoc) return;
    deleteDealDocument(selectedDoc.id);
    toast.success('Deleted');
    refresh();
  };

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Document Chamber for deals and contracts</p>
        </div>
        
        <Button leftIcon={<Upload size={18} />} onClick={open}>
          Upload Document
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" {...getRootProps()}>
        <input {...getInputProps()} />
        {/* Storage info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Chamber</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              isDragActive ? 'border-primary-400 bg-primary-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white mx-auto border border-gray-200">
                <Upload size={20} className="text-primary-600" />
              </div>
              <div className="mt-3 text-sm font-medium text-gray-900">
                {isDragActive ? 'Drop to upload' : 'Drag & drop a document'}
              </div>
              <div className="mt-1 text-sm text-gray-600">
                PDF, DOC/DOCX, XLS/XLSX, images
              </div>
              <Button variant="outline" size="sm" className="mt-3" onClick={open}>
                Browse files
              </Button>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quick Access</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2 text-sm rounded-md bg-gray-50">
                  <span className="text-gray-700">Documents</span>
                  <span className="font-medium text-gray-900">{documents.length}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 text-sm rounded-md bg-gray-50">
                  <span className="text-gray-700">Signed</span>
                  <span className="font-medium text-gray-900">{documents.filter(d => d.status === 'signed').length}</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Document list */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">All Documents</h2>
                <div className="flex items-center gap-2">
                  {selectedDoc && (
                    <Badge variant={statusVariant(selectedDoc.status)} size="sm">
                      {statusLabel(selectedDoc.status)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {documents.length === 0 ? (
                    <div className="text-sm text-gray-600 p-4">
                      Upload a contract or deal document to begin.
                    </div>
                  ) : (
                    documents.map(doc => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setSelectedId(doc.id)}
                        className={`w-full text-left flex items-center p-4 rounded-lg transition-colors duration-200 ${
                          selectedId === doc.id ? 'bg-primary-50 border border-primary-100' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="p-2 bg-white rounded-lg mr-4 border border-gray-200">
                          <FileText size={22} className="text-primary-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {doc.name}
                            </h3>
                            <Badge variant={statusVariant(doc.status)} size="sm">
                              {statusLabel(doc.status)}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span>{doc.type}</span>
                            <span>{doc.size}</span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardBody>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Preview & Signature</h2>
                  <p className="text-sm text-gray-600">Review, update status, and sign</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setStatus('draft')} disabled={!selectedDoc}>
                    Draft
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setStatus('in_review')} disabled={!selectedDoc}>
                    In Review
                  </Button>
                  <Button variant="success" size="sm" onClick={() => setStatus('signed')} disabled={!selectedDoc}>
                    Signed
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadSelected} disabled={!selectedDoc?.dataUrl} leftIcon={<Download size={16} />}>
                    Download
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deleteSelected} disabled={!selectedDoc} className="text-error-600 hover:text-error-700" leftIcon={<Trash2 size={16} />}>
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {!selectedDoc ? (
                  <div className="text-sm text-gray-600">
                    Select a document from the list to preview and sign.
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                      {selectedDoc.dataUrl && selectedDoc.type === 'PDF' ? (
                        <iframe title="PDF preview" src={selectedDoc.dataUrl} className="w-full h-[420px]" />
                      ) : selectedDoc.dataUrl && selectedDoc.dataUrl.startsWith('data:image') ? (
                        <img src={selectedDoc.dataUrl} alt={selectedDoc.name} className="w-full h-[420px] object-contain bg-gray-50" />
                      ) : (
                        <div className="h-[420px] flex flex-col items-center justify-center bg-gray-50 p-6">
                          <div className="p-3 bg-white rounded-full border border-gray-200">
                            <FileText size={26} className="text-gray-500" />
                          </div>
                          <div className="mt-3 text-sm font-medium text-gray-900">Preview not available</div>
                          <div className="text-sm text-gray-600 mt-1">You can still download and sign.</div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-900">E-signature (mock)</div>
                          <Badge variant="secondary" size="sm">Signature pad</Badge>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-3">
                          <div className="w-full h-40">
                            <canvas
                              ref={canvasRef}
                              className="w-full h-full touch-none bg-white"
                              onPointerDown={startDraw}
                              onPointerMove={draw}
                              onPointerUp={endDraw}
                              onPointerLeave={endDraw}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={clearCanvas}>
                            Clear
                          </Button>
                          <Button size="sm" onClick={saveSignature} leftIcon={<PenTool size={16} />}>
                            Sign
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-sm font-medium text-gray-900">Signed status</div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Status</span>
                            <Badge variant={statusVariant(selectedDoc.status)} size="sm">
                              {statusLabel(selectedDoc.status)}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            {selectedDoc.signedAt ? `Signed at ${selectedDoc.signedAt}` : 'Not signed yet'}
                          </div>
                        </div>

                        {selectedDoc.signatureDataUrl && (
                          <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <div className="text-sm font-medium text-gray-900">Stored signature</div>
                            <img
                              src={selectedDoc.signatureDataUrl}
                              alt="Signature"
                              className="mt-2 w-full h-24 object-contain bg-gray-50 rounded-md border border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
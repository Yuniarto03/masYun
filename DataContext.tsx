import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { TableRow, TableData, FileHeaders, AppDisplayMode, PivotReportState, ChartState, initialChartState, DashboardWidget, RecentProject, SavedProject, SavedProjectState, SavedFile } from '../types';
import * as XLSX from 'xlsx';

// --- Local Parsing Functions (to be used by both DataUpload and FileLibrary) ---
const parseCSV = (csvText: string): { headers: FileHeaders; rows: TableRow[] } => {
    const lines = csvText.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    if (lines.length === 0) return { headers: [], rows: [] };
    const firstLine = lines[0].charCodeAt(0) === 0xFEFF ? lines[0].substring(1) : lines[0];
    
    const headers: FileHeaders = [];
    let currentHeader = '';
    let inQuotes = false;
    for (let i = 0; i < firstLine.length; i++) {
        const char = firstLine[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
            headers.push(currentHeader.trim().replace(/^"|"$/g, ''));
            currentHeader = '';
        } else currentHeader += char;
    }
    headers.push(currentHeader.trim().replace(/^"|"$/g, ''));

    const rows: TableRow[] = [];
    for (let i = 1; i < lines.length; i++) {
        const values: string[] = [];
        let currentValue = '';
        inQuotes = false;
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim().replace(/^"|"$/g, ''));
                currentValue = '';
            } else currentValue += char;
        }
        values.push(currentValue.trim().replace(/^"|"$/g, ''));

        if (values.length === headers.length) {
            const row: TableRow = {};
            headers.forEach((header, index) => {
                const value = values[index];
                row[header] = isNaN(Number(value)) || value === '' ? value : Number(value);
            });
            rows.push(row);
        }
    }
    return { headers, rows };
};

const parseExcelSheet = (workbook: XLSX.WorkBook, sheetName: string): { headers: FileHeaders; rows: TableRow[] } => {
    const worksheet = workbook.Sheets[sheetName];
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', rawNumbers: false });
    if (!rawData || rawData.length === 0) return { headers: [], rows: [] };

    const headers: FileHeaders = rawData[0] ? rawData[0].map(String) : [];
    const rows: TableRow[] = rawData.slice(1).map(rowValues => {
        const row: TableRow = {};
        headers.forEach((header, index) => {
            const value = rowValues[index];
            if (value instanceof Date) row[header] = value;
            else if (typeof value === 'number' || typeof value === 'boolean') row[header] = value;
            else if (typeof value === 'string') row[header] = isNaN(Number(value)) || value.trim() === '' ? value : Number(value);
            else row[header] = String(value);
        });
        return row;
    });
    return { headers, rows };
};

const parseJSON = (jsonText: string): { headers: FileHeaders; rows: TableRow[] } => {
    const data = JSON.parse(jsonText);
    let jsonData: any[];

    if (Array.isArray(data)) {
        jsonData = data;
    } else if (typeof data === 'object' && data !== null) {
        const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
        if (arrayKey) {
            jsonData = data[arrayKey];
        } else {
            throw new Error("JSON data is not an array and no array found in the first level of the object.");
        }
    } else {
        throw new Error("Unsupported JSON structure. Expected an array of objects or an object containing an array of objects.");
    }
    
    if (jsonData.length === 0) return { headers: [], rows: [] };
    
    const headers = Object.keys(jsonData[0]);
    const rows: TableRow[] = jsonData.map(item => {
        const row: TableRow = {};
        headers.forEach(header => {
            const value = item[header];
            if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean' || value instanceof Date) {
                row[header] = value;
            } else {
                row[header] = String(value); 
            }
        });
        return row;
    });
    return { headers, rows };
};


interface DataContextType {
  tableData: TableData;
  setTableData: React.Dispatch<React.SetStateAction<TableData>>;
  fileHeaders: FileHeaders;
  setFileHeaders: React.Dispatch<React.SetStateAction<FileHeaders>>;
  interfaceDisplayMode: AppDisplayMode;
  setInterfaceDisplayMode: React.Dispatch<React.SetStateAction<AppDisplayMode>>;
  
  pivotSourceData: TableData | null;
  setPivotSourceData: React.Dispatch<React.SetStateAction<TableData | null>>;
  
  statisticalAnalysisData: TableData | null;
  setStatisticalAnalysisData: React.Dispatch<React.SetStateAction<TableData | null>>;
  statisticalAnalysisVisibleColumns: Set<string> | null;
  setStatisticalAnalysisVisibleColumns: React.Dispatch<React.SetStateAction<Set<string> | null>>;
  
  visualizationState: { chart1: ChartState; chart2: ChartState };
  setVisualizationState: React.Dispatch<React.SetStateAction<{ chart1: ChartState; chart2: ChartState }>>;
  
  pivotReports: PivotReportState[];
  setPivotReports: React.Dispatch<React.SetStateAction<PivotReportState[]>>;
  activePivotId: string | null;
  setActivePivotId: React.Dispatch<React.SetStateAction<string | null>>;

  dashboardWidgets: DashboardWidget[];
  setDashboardWidgets: React.Dispatch<React.SetStateAction<DashboardWidget[]>>;

  recentProjects: RecentProject[];
  setRecentProjects: React.Dispatch<React.SetStateAction<RecentProject[]>>;

  savedProjects: SavedProject[];
  saveCurrentProject: (projectName: string) => void;
  loadProject: (projectId: string) => boolean;
  deleteProject: (projectId: string) => void;

  savedFiles: SavedFile[];
  saveRawFile: (file: File) => void;
  loadRawFile: (fileId: string) => void;
  deleteRawFile: (fileId: string) => void;
}

export const DataContext = createContext<DataContextType>({} as DataContextType);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [tableData, setTableData] = useState<TableData>([]);
  const [fileHeaders, setFileHeaders] = useState<FileHeaders>([]);
  const [interfaceDisplayMode, setInterfaceDisplayMode] = useState<AppDisplayMode>('normal');
  const [pivotSourceData, setPivotSourceData] = useState<TableData | null>(null);
  const [statisticalAnalysisData, setStatisticalAnalysisData] = useState<TableData | null>(null);
  const [statisticalAnalysisVisibleColumns, setStatisticalAnalysisVisibleColumns] = useState<Set<string> | null>(null);
  
  const [visualizationState, setVisualizationState] = useState({
    chart1: initialChartState,
    chart2: { ...initialChartState, chartOptions: {...initialChartState.chartOptions, chartStyleId: 'cyberpunkNight'} }
  });
  const [pivotReports, setPivotReports] = useState<PivotReportState[]>([]);
  const [activePivotId, setActivePivotId] = useState<string | null>(null);
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidget[]>([]);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);

  useEffect(() => {
    try {
      const storedProjects = localStorage.getItem('masyun_saved_projects');
      if (storedProjects) setSavedProjects(JSON.parse(storedProjects));
      const storedFiles = localStorage.getItem('masyun_saved_files');
      if (storedFiles) setSavedFiles(JSON.parse(storedFiles));
    } catch (e) {
      console.error("Failed to load from localStorage", e);
    }
  }, []);

  const saveCurrentProject = (projectName: string) => {
    const currentState: SavedProjectState = {
      tableData, fileHeaders, pivotReports, activePivotId, dashboardWidgets, visualizationState
    };
    const newProject: SavedProject = {
      id: `proj_${Date.now()}`, name: projectName, savedAt: new Date().toISOString(), state: currentState
    };
    const updatedProjects = [...savedProjects, newProject];
    setSavedProjects(updatedProjects);
    localStorage.setItem('masyun_saved_projects', JSON.stringify(updatedProjects));
    alert(`Project "${projectName}" saved successfully! You can access it from the File Library.`);
  };

  const loadProject = (projectId: string): boolean => {
    const projectToLoad = savedProjects.find(p => p.id === projectId);
    if (projectToLoad?.state) {
      const { state } = projectToLoad;
      setTableData(state.tableData || []);
      setFileHeaders(state.fileHeaders || []);
      setPivotReports(state.pivotReports || []);
      setActivePivotId(state.activePivotId || null);
      setDashboardWidgets(state.dashboardWidgets || []);
      setVisualizationState(state.visualizationState || { chart1: initialChartState, chart2: initialChartState });
      alert(`Project "${projectToLoad.name}" loaded.`);
      return true;
    }
    alert(`Failed to load project.`);
    return false;
  };

  const deleteProject = (projectId: string) => {
    const updatedProjects = savedProjects.filter(p => p.id !== projectId);
    setSavedProjects(updatedProjects);
    localStorage.setItem('masyun_saved_projects', JSON.stringify(updatedProjects));
  };
  
  const saveRawFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const content = (event.target.result as string).split(',')[1];
        const newFile: SavedFile = {
          id: `file_${Date.now()}`, name: file.name, type: file.type, content: content, savedAt: new Date().toISOString(),
        };
        const updatedFiles = [...savedFiles, newFile];
        setSavedFiles(updatedFiles);
        localStorage.setItem('masyun_saved_files', JSON.stringify(updatedFiles));
        alert(`File "${file.name}" saved to library.`);
      }
    };
    reader.onerror = () => alert(`Error reading file "${file.name}" for saving.`);
    reader.readAsDataURL(file);
  };

  const loadRawFile = (fileId: string) => {
    const fileToLoad = savedFiles.find(f => f.id === fileId);
    if (!fileToLoad) { alert("File not found in library."); return; }
    try {
      const fileExtension = fileToLoad.name.split('.').pop()?.toLowerCase();
      let result: { headers: string[], rows: TableRow[] };

      if (fileToLoad.type === 'text/csv' || fileExtension === 'csv') {
        const decodedContent = atob(fileToLoad.content);
        result = parseCSV(decodedContent);
      } else if (fileToLoad.type === 'application/json' || fileExtension === 'json') {
        const decodedContent = atob(fileToLoad.content);
        result = parseJSON(decodedContent);
      } else if (fileToLoad.type.includes('spreadsheetml') || fileToLoad.type.includes('ms-excel') || fileExtension === 'xls' || fileExtension === 'xlsx') {
        const binaryString = atob(fileToLoad.content);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
        
        const workbook = XLSX.read(bytes, { type: 'array', cellDates: true });
        const sheetNames = workbook.SheetNames;
        if (sheetNames.length === 0) throw new Error("Excel file contains no sheets.");
        
        let chosenSheet = sheetNames[0];
        if (sheetNames.length > 1) {
          const input = prompt(`Please select a sheet to load:\n\n${sheetNames.join('\n')}`, sheetNames[0]);
          if (input && sheetNames.includes(input)) {
            chosenSheet = input;
          } else if (input !== null) { // User clicked cancel
            alert("Invalid sheet name. Loading the first sheet by default.");
          } else {
            return; // User cancelled prompt
          }
        }
        result = parseExcelSheet(workbook, chosenSheet);
      } else {
        throw new Error(`Unsupported file type for loading: ${fileToLoad.type}`);
      }

      setTableData(result.rows);
      setFileHeaders(result.headers);
      alert(`Data from "${fileToLoad.name}" loaded successfully.`);
    } catch (e: any) {
      alert(`Failed to load and parse file: ${e.message}`);
    }
  };

  const deleteRawFile = (fileId: string) => {
    const updatedFiles = savedFiles.filter(f => f.id !== fileId);
    setSavedFiles(updatedFiles);
    localStorage.setItem('masyun_saved_files', JSON.stringify(updatedFiles));
  };


  return (
    <DataContext.Provider value={{ 
      tableData, setTableData, 
      fileHeaders, setFileHeaders,
      interfaceDisplayMode, setInterfaceDisplayMode,
      pivotSourceData, setPivotSourceData,
      statisticalAnalysisData, setStatisticalAnalysisData,
      statisticalAnalysisVisibleColumns, setStatisticalAnalysisVisibleColumns,
      visualizationState, setVisualizationState,
      pivotReports, setPivotReports,
      activePivotId, setActivePivotId,
      dashboardWidgets, setDashboardWidgets,
      recentProjects, setRecentProjects,
      savedProjects, saveCurrentProject, loadProject, deleteProject,
      savedFiles, saveRawFile, loadRawFile, deleteRawFile
    }}>
      {children}
    </DataContext.Provider>
  );
};
declare module 'react-sortable-tree-theme-minimal' {
  import { ThemeProps } from 'react-sortable-tree';
  
  const FileExplorerTheme: Required<ThemeProps> & {
    scaffoldBlockPxWidth: number;
    slideRegionSize: number;
    treeNodeRenderer: any;
    nodeContentRenderer: any;
    placeholderRenderer: any;
  };
  
  export default FileExplorerTheme;
}

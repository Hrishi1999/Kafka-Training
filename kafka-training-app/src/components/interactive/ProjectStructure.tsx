import React from 'react';
import { Folder, File } from 'lucide-react';

const ProjectStructure: React.FC<any> = ({ structure }) => {
  const renderTree = (tree: any, level = 0) => {
    return Object.entries(tree).map(([key, value]) => {
      const isFolder = typeof value === 'object';
      return (
        <div key={key} style={{ marginLeft: `${level * 20}px` }} className="my-1">
          <div className="flex items-center space-x-2 hover:bg-gray-100 p-1 rounded">
            {isFolder ? (
              <Folder className="h-4 w-4 text-blue-600" />
            ) : (
              <File className="h-4 w-4 text-gray-600" />
            )}
            <span className="text-sm text-gray-800">{key}</span>
            {!isFolder && <span className="text-xs text-gray-500 ml-2">{value as string}</span>}
          </div>
          {isFolder && renderTree(value, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 font-mono">
      {structure && renderTree(structure)}
    </div>
  );
};

export default ProjectStructure;
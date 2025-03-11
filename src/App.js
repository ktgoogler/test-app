import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Settings,
  ListChecks,
  Save,
} from 'lucide-react';

// Types
interface ValidationRule {
  type: 'string' | 'integer' | 'boolean' | 'float';
  regex?: string;
  allowedValues?: string[];
  min?: number;
  max?: number;
}

interface ColumnConfig {
  name: string;
  validation: ValidationRule;
}

interface AppState {
  columnConfigs: ColumnConfig[];
  availableColumns: string[];
  loading: boolean;
  error: string | null;
  yamlConfig: string;
  configSaved: boolean;
}

// Initial state
const initialState: AppState = {
  columnConfigs: [],
  availableColumns: [
    'store_id',
    'zone_name',
    'machine_project_id',
    'fleet_project_id',
    'cluster_name',
    'location',
    'node_count',
    'cluster_ipv4_cidr',
    'services_ipv4_cidr',
    'external_load_balancer_ipv4_address_pools',
    'sync_repo',
    'sync_branch',
    'sync_dir',
    'secrets_project_id',
    'git_token_secrets_manager_name',
    'cluster_version',
    'maintenance_window_start',
    'maintenance_window_end',
    'maintenance_window_recurrence',
    'maintenance_exclusion_name_1',
    'maintenance_exclusion_start_1',
    'maintenance_exclusion_end_1',
    'subnet_vlans',
    'recreate_on_delete',
  ],
  loading: false,
  error: null,
  yamlConfig: '',
  configSaved: false,
};

// Animation Variants
const columnConfigVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.2 } },
};

// Helper function to generate YAML (simplified for demonstration)
const generateYamlConfig = (columnConfigs: ColumnConfig[]): string => {
  const config: { [key: string]: ValidationRule } = {};
  columnConfigs.forEach((col) => {
    config[col.name] = col.validation;
  });
  return `# Validation Configuration
# This file defines the validation rules for your data.
# Each column in your data file should have an entry here.

validations:
${Object.entries(config)
  .map(
    ([column, rules]) => `  ${column}:
    type: ${rules.type || 'string'}
    ${rules.regex ? `regex: "${rules.regex}"` : ''}
    ${
      rules.allowedValues
        ? `allowed_values: ${JSON.stringify(rules.allowedValues)}`
        : ''
    }
    ${rules.min !== undefined ? `min: ${rules.min}` : ''}
    ${rules.max !== undefined ? `max: ${rules.max}` : ''}`,
  )
  .join('\n')}
`;
};

// Main App Component
const DataValidationApp = () => {
  const [state, setState] = useState<AppState>(initialState);

  // Function to add a new column configuration
  const addColumnConfig = useCallback(() => {
    if (state.availableColumns.length > 0) {
      const newColumnName = state.availableColumns[0]; // Start with first available
      const newConfig: ColumnConfig = {
        name: newColumnName,
        validation: { type: 'string' }, // Default type
      };
      setState((prevState) => ({
        ...prevState,
        columnConfigs: [...prevState.columnConfigs, newConfig],
        availableColumns: prevState.availableColumns.slice(1), // Remove selected
        configSaved: false, // Mark config as unsaved
      }));
    }
  }, [state.availableColumns, state.columnConfigs]);

  // Function to remove a column configuration
  const removeColumnConfig = useCallback(
    (index: number) => {
      const removedColumn = state.columnConfigs[index].name;
      setState((prevState) => ({
        ...prevState,
        columnConfigs: prevState.columnConfigs.filter((_, i) => i !== index),
        availableColumns: [...prevState.availableColumns, removedColumn].sort(), // Add back
        configSaved: false,
      }));
    },
    [state.availableColumns, state.columnConfigs],
  );

  // Function to update a column's configuration
  const updateColumnConfig = useCallback(
    (index: number, newConfig: Partial<ColumnConfig>) => {
      setState((prevState) => {
        const updatedConfigs = [...prevState.columnConfigs];
        updatedConfigs[index] = {
          ...updatedConfigs[index],
          ...newConfig,
          validation: {
            ...updatedConfigs[index].validation,
            ...(newConfig.validation || {}),
          },
        };
        return {
          ...prevState,
          columnConfigs: updatedConfigs,
          configSaved: false,
        };
      });
    },
    [state.columnConfigs],
  );

  // Function to handle column selection
  const handleColumnSelect = useCallback(
    (index: number, selectedColumn: string) => {
      setState((prevState) => {
        const oldColumnName = prevState.columnConfigs[index].name;
        const updatedConfigs = [...prevState.columnConfigs];
        updatedConfigs[index] = {
          ...updatedConfigs[index],
          name: selectedColumn,
        };

        // Update available columns: remove new, add old
        const updatedAvailable = prevState.availableColumns
          .filter((col) => col !== selectedColumn)
          .concat(oldColumnName)
          .sort();

        return {
          ...prevState,
          columnConfigs: updatedConfigs,
          availableColumns: updatedAvailable,
          configSaved: false,
        };
      });
    },
    [state.availableColumns, state.columnConfigs],
  );

  const handleGenerateConfig = () => {
    const yaml = generateYamlConfig(state.columnConfigs);
    setState((prev) => ({ ...prev, yamlConfig: yaml, configSaved: false }));
  };

  const handleSaveConfig = () => {
    const yaml = generateYamlConfig(state.columnConfigs);
    setState((prev) => ({ ...prev, yamlConfig: yaml, configSaved: true }));
    // Create a Blob from the YAML string
    const blob = new Blob([yaml], { type: 'text/yaml' });
    // Create an object URL from the Blob
    const url = URL.createObjectURL(blob);
    // Create a link element
    const a = document.createElement('a');
    a.href = url;
    a.download = 'validation_config.yaml'; // Set the filename
    // Append the link to the document
    document.body.appendChild(a);
    // Trigger the download
    a.click();
    // Remove the link from the document
    document.body.removeChild(a);
    // Revoke the object URL to prevent memory leak
    URL.revokeObjectURL(url);
  };

  const sortedColumnConfigs = [...state.columnConfigs].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-4 md:p-8"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"
          >
            Low-Code Data Validation
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Configure validation rules for your data with ease.
          </p>
        </div>

        {/* Column Configurations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-200 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Column Configurations
            </h2>
            <div className="flex gap-2">
              <Button
                onClick={addColumnConfig}
                className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 transition-colors"
                disabled={state.availableColumns.length === 0}
              >
                Add Column
              </Button>
            </div>
          </div>
          <AnimatePresence>
            {sortedColumnConfigs.map((columnConfig, index) => (
              <motion.div
                key={index}
                variants={columnConfigVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-lg shadow-md space-y-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <Label
                      htmlFor={`column-select-${index}`}
                      className="text-gray-300 block mb-1"
                    >
                      Column
                    </Label>
                    <Select
                      value={columnConfig.name}
                      onValueChange={(value) =>
                        handleColumnSelect(index, value)
                      }
                      id={`column-select-${index}`}
                    >
                      <SelectTrigger
                        className="w-full bg-black/20 border-purple-500/30 text-white"
                      >
                        <SelectValue placeholder="Select a column" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {/* Use the sorted available columns here */}
                        {state.availableColumns
                          .concat(columnConfig.name)
                          .sort()
                          .map((col) => (
                            <SelectItem
                              key={col}
                              value={col}
                              className="hover:bg-purple-500/20 text-white"
                            >
                              {col}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => removeColumnConfig(index)}
                    className="bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-colors"
                  >
                    Remove
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor={`type-select-${index}`}
                    className="text-gray-300 block"
                  >
                    Data Type
                  </Label>
                  <Select
                    value={columnConfig.validation.type}
                    onValueChange={(value) =>
                      updateColumnConfig(index, {
                        validation: { type: value as any },
                      })
                    }
                    id={`type-select-${index}`}
                  >
                    <SelectTrigger
                      className="w-full bg-black/20 border-purple-500/30 text-white"
                    >
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem
                        value="string"
                        className="hover:bg-purple-500/20 text-white"
                      >
                        String
                      </SelectItem>
                      <SelectItem
                        value="integer"
                        className="hover:bg-purple-500/20 text-white"
                      >
                        Integer
                      </SelectItem>
                      <SelectItem
                        value="float"
                        className="hover:bg-purple-500/20 text-white"
                      >
                        Float
                      </SelectItem>
                      <SelectItem
                        value="boolean"
                        className="hover:bg-purple-500/20 text-white"
                      >
                        Boolean
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {columnConfig.validation.type === 'string' && (
                  <div className="space-y-2">
                    <Label
                      htmlFor={`regex-input-${index}`}
                      className="text-gray-300 block"
                    >
                      Regular Expression
                    </Label>
                    <Input
                      id={`regex-input-${index}`}
                      value={columnConfig.validation.regex || ''}
                      onChange={(e) =>
                        updateColumnConfig(index, {
                          validation: { regex: e.target.value },
                        })
                      }
                      placeholder="Enter regex (e.g., ^[a-zA-Z0-9_-]+$)"
                      className="bg-black/20 border-purple-500/30 text-white"
                    />
                  </div>
                )}

                {(columnConfig.validation.type === 'string' ||
                  columnConfig.validation.type === 'integer' ||
                  columnConfig.validation.type === 'float') && (
                  <div className="space-y-2">
                    <Label
                      htmlFor={`allowed-values-input-${index}`}
                      className="text-gray-300 block"
                    >
                      Allowed Values (comma-separated)
                    </Label>
                    <Textarea
                      id={`allowed-values-input-${index}`}
                      value={
                        columnConfig.validation.allowedValues
                          ? columnConfig.validation.allowedValues.join(', ')
                          : ''
                      }
                      onChange={(e) =>
                        updateColumnConfig(index, {
                          validation: {
                            allowedValues: e.target.value
                              .split(',')
                              .map((v) => v.trim())
                              .filter((v) => v !== ''),
                          },
                        })
                      }
                      placeholder="Enter allowed values (e.g., value1, value2, value3)"
                      className="bg-black/20 border-purple-500/30 text-white min-h-[2.5rem]"
                    />
                  </div>
                )}

                {(columnConfig.validation.type === 'integer' ||
                  columnConfig.validation.type === 'float') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor={`min-input-${index}`}
                        className="text-gray-300 block"
                      >
                        Minimum Value
                      </Label>
                      <Input
                        id={`min-input-${index}`}
                        type="number"
                        value={
                          columnConfig.validation.min !== undefined
                            ? columnConfig.validation.min
                            : ''
                        }
                        onChange={(e) =>
                          updateColumnConfig(index, {
                            validation: {
                              min: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            },
                          })
                        }
                        placeholder="Enter minimum"
                        className="bg-black/20 border-purple-500/30 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor={`max-input-${index}`}
                        className="text-gray-300 block"
                      >
                        Maximum Value
                      </Label>
                      <Input
                        id={`max-input-${index}`}
                        type="number"
                        value={
                          columnConfig.validation.max !== undefined
                            ? columnConfig.validation.max
                            : ''
                        }
                        onChange={(e) =>
                          updateColumnConfig(index, {
                            validation: {
                              max: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            },
                          })
                        }
                        placeholder="Enter maximum"
                        className="bg-black/20 border-purple-500/30 text-white"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Generate Configuration */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-200 flex items-center gap-2">
            <ListChecks className="w-5 h-5" />
            Configuration Output
          </h2>
          <div className="flex gap-4">
            <Button
              onClick={handleGenerateConfig}
              className="bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300 transition-colors"
            >
              Generate YAML
            </Button>
            <Button
              onClick={handleSaveConfig}
              className={cn(
                'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 hover:text-purple-300 transition-colors',
                state.configSaved &&
                  'bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300',
              )}
            >
              {state.configSaved ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" /> Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Save
                </>
              )}
            </Button>
          </div>
          <Textarea
            value={state.yamlConfig}
            readOnly
            rows={10}
            className="bg-black/20 border-purple-500/30 text-gray-200 font-mono text-sm shadow-inner"
            placeholder="# Your YAML configuration will appear here..."
          />
        </div>
      </div>
    </div>
  );
};

export default DataValidationApp;

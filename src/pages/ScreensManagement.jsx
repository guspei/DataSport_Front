import { useState, useEffect, useRef } from 'react';
import {
  getTranslations,
  getScreens,
  createScreen,
  deleteScreen,
  addKeyToScreen,
  removeKeyFromScreen,
  reorderScreens
} from '../services/api';


// CreateScreenButton component
function CreateScreenButton({ onCreate }) {
  const [isCreating, setIsCreating] = useState(false);
  const [screenName, setScreenName] = useState('');

  const handleCreate = async (e) => {
    if (e) e.preventDefault(); // Prevent form submission
    if (screenName.trim()) {
      try {
        await onCreate(screenName.trim());
        setScreenName('');
        setIsCreating(false);
      } catch (error) {
        console.error('Error creating screen:', error);
        // Keep the form open on error
      }
    }
  };

  const handleCancel = () => {
    setScreenName('');
    setIsCreating(false);
  };

  if (isCreating) {
    return (
      <form onSubmit={handleCreate} className="flex items-center gap-2">
        <input
          type="text"
          value={screenName}
          onChange={(e) => setScreenName(e.target.value)}
          placeholder="Screen name..."
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-milo-red focus:border-milo-red"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleCancel();
          }}
        />
        <button
          type="submit"
          className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
        >
          Create
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="px-3 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors text-sm"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={() => setIsCreating(true)}
      className="px-4 py-2 bg-milo-red text-white rounded-lg hover:bg-milo-dark transition-colors text-sm font-medium flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      Add Screen
    </button>
  );
}

// AssignToScreenDropdown component
function AssignToScreenDropdown({ selectedCount, customScreens, onAssign, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const screenNames = Object.keys(customScreens);

  const handleAssign = (screenName) => {
    onAssign(screenName);
    setIsOpen(false);
  };

  if (screenNames.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        Create a screen first to assign flags
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
          disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-milo-red text-white hover:bg-milo-dark'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        Assign to Screen ({selectedCount})
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
          <div className="py-1">
            {screenNames.map((screenName) => (
              <button
                key={screenName}
                onClick={() => handleAssign(screenName)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
              >
                <span>{screenName}</span>
                <span className="text-xs text-gray-500">
                  {customScreens[screenName]?.size || 0} keys
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScreensManagement() {
  const [translations, setTranslations] = useState({});
  const [flatTranslations, setFlatTranslations] = useState({});
  const [filesMetadata, setFilesMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const [customScreens, setCustomScreens] = useState({});
  const [unassignedFlags, setUnassignedFlags] = useState(new Set());
  const [selectedUnassignedFlags, setSelectedUnassignedFlags] = useState(new Set());
  const [draggedFlag, setDraggedFlag] = useState(null);
  const [draggedFromScreen, setDraggedFromScreen] = useState(null);
  const [collapsedScreens, setCollapsedScreens] = useState(new Set());
  const [draggedScreen, setDraggedScreen] = useState(null);
  const [screenOrder, setScreenOrder] = useState([]);

  // Helper function to flatten nested object into dot-notation keys
  const flattenObject = (obj, prefix = '') => {
    const flattened = {};

    if (!obj || typeof obj !== 'object') {
      return flattened;
    }

    Object.keys(obj).forEach(key => {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key], newKey));
      } else {
        // Convert to string to avoid React rendering issues
        flattened[newKey] = String(obj[key] || '');
      }
    });

    return flattened;
  };

  // Helper function to get file metadata for a specific key
  const getFileMetadataForKey = (key) => {
    // Extract the first part of the key (section) to match with files metadata
    const section = key.split('.')[0];
    const fileName = `${section}.json`;

    if (filesMetadata[fileName]) {
      return {
        repository: filesMetadata[fileName].repository,
        folder: filesMetadata[fileName].folder,
        source: filesMetadata[fileName].source,
        fileName: fileName
      };
    }

    return null;
  };

  useEffect(() => {
    const loadData = async () => {
      await loadTranslations('en'); // Always load English translations
      await loadCustomScreenConfiguration();
    };
    loadData();
  }, []);

  useEffect(() => {
    // Initialize unassigned flags when translations load or custom screens change
    if (Object.keys(translations).length > 0) {
      initializeUnassignedFlags();
    }
  }, [translations, customScreens]);


  const loadTranslations = async (lang) => {
    try {
      setLoading(true);
      const res = await getTranslations(lang);
      const translationsData = res.data.content;
      const filesData = res.data.files || {};

      setTranslations(translationsData);
      setFilesMetadata(filesData);

      // Flatten the nested translations for UI display
      const flattened = flattenObject(translationsData);
      setFlatTranslations(flattened);
    } catch (err) {
      console.error('Error loading translations');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomScreenConfiguration = async () => {
    try {
      const response = await getScreens();
      const screens = response.data;
      
      // Convert screens to the format expected by the UI
      const screenGroups = {};
      screens.forEach(screen => {
        screenGroups[screen.name] = new Set(screen.keys || []);
      });
      
      setCustomScreens(screenGroups);

      // Initialize screen order from backend or use default order
      const sortedScreens = screens.sort((a, b) => {
        // Sort by order field if it exists, otherwise by creation date
        const orderA = a.order !== undefined ? a.order : 999999;
        const orderB = b.order !== undefined ? b.order : 999999;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      });

      const orderedScreenNames = sortedScreens.map(screen => screen.name);
      setScreenOrder(orderedScreenNames);

      // Calculate unassigned flags
      if (Object.keys(translations).length > 0) {
        const assignedKeys = new Set();
        screens.forEach(screen => {
          screen.keys?.forEach(key => assignedKeys.add(key));
        });
        
        const allKeys = Object.keys(flattenObject(translations));
        const unassigned = allKeys.filter(key => !assignedKeys.has(key));
        setUnassignedFlags(new Set(unassigned));
      }
    } catch (error) {
      console.error('Error loading screens from database:', error);
      setCustomScreens({});
      setUnassignedFlags(new Set());
    }
  };


  const initializeUnassignedFlags = () => {
    if (Object.keys(translations).length > 0) {
      // Get all existing assigned flags (keys are now simple strings)
      const assignedFlags = new Set();
      Object.values(customScreens).forEach(screenFlags => {
        screenFlags.forEach(key => {
          assignedFlags.add(key); // Keys are already simple strings like "[common] SAVE"
        });
      });

      // Create unassigned flags from translation keys not in any screen
      const unassigned = new Set();
      Object.keys(flatTranslations).forEach(key => {
        if (!assignedFlags.has(key)) {
          unassigned.add(key); // Store key directly as simple string
        }
      });
      
      setUnassignedFlags(unassigned);
    }
  };

  const createNewScreen = async (screenName) => {
    if (screenName.trim() && !customScreens[screenName]) {
      try {
        // Create individual screen record in database
        await createScreen({
          name: screenName.trim(),
          keys: [],
          description: `Custom screen: ${screenName.trim()}`,
          isShared: true
        });
        
        // Reload screens from database to update UI
        await loadCustomScreenConfiguration();
      } catch (error) {
        console.error('Error creating screen:', error);
        alert('Error creating screen. Please try again.');
      }
    }
  };

  const deleteCustomScreen = async (screenName) => {
    if (customScreens[screenName]) {
      if (!confirm(`Are you sure you want to delete screen "${screenName}"? All assigned keys will move back to unassigned.`)) {
        return;
      }
      
      try {
        // Find the screen record to delete
        const response = await getScreens();
        const screen = response.data.find(s => s.name === screenName);
        
        if (screen) {
          await deleteScreen(screen._id);
          // Reload screens from database to update UI
          await loadCustomScreenConfiguration();
        }
      } catch (error) {
        console.error('Error deleting screen:', error);
        alert('Error deleting screen. Please try again.');
      }
    }
  };

  // Handle unassigned flag selection
  const toggleUnassignedFlag = (flagStr) => {
    const newSelection = new Set(selectedUnassignedFlags);
    if (newSelection.has(flagStr)) {
      newSelection.delete(flagStr);
    } else {
      newSelection.add(flagStr);
    }
    setSelectedUnassignedFlags(newSelection);
  };

  const selectAllUnassignedFlags = () => {
    setSelectedUnassignedFlags(new Set(unassignedFlags));
  };

  const clearUnassignedSelection = () => {
    setSelectedUnassignedFlags(new Set());
  };

  // Assign selected flags to a screen
  const assignSelectedToScreen = async (screenName) => {
    if (selectedUnassignedFlags.size === 0) return;

    try {
      // Find the screen record
      const response = await getScreens();
      const screen = response.data.find(s => s.name === screenName);
      
      if (!screen) {
        console.error('Screen not found:', screenName);
        return;
      }

      // Add each selected flag to the screen
      for (const flagStr of selectedUnassignedFlags) {
        try {
          await addKeyToScreen(screen._id, flagStr);
        } catch (error) {
          console.error('Error adding key to screen:', error);
        }
      }

      // Clear selection and reload
      setSelectedUnassignedFlags(new Set());
      await loadCustomScreenConfiguration();
    } catch (error) {
      console.error('Error assigning flags to screen:', error);
      alert('Error assigning flags. Please try again.');
    }
  };

  // Remove a key from a screen and move it back to unassigned
  const removeKeyFromCustomScreen = async (screenName, flagStr) => {
    try {
      // Find the screen record
      const response = await getScreens();
      const screen = response.data.find(s => s.name === screenName);
      
      if (!screen) {
        console.error('Screen not found:', screenName);
        return;
      }

      // Remove the key from the screen (using API function)
      await removeKeyFromScreen(screen._id, flagStr);
      
      // Reload configuration to update UI
      await loadCustomScreenConfiguration();
    } catch (error) {
      console.error('Error removing key from screen:', error);
      alert('Error removing key. Please try again.');
    }
  };

  const handleDragStart = (e, flagData, fromScreen) => {
    setDraggedFlag(flagData);
    setDraggedFromScreen(fromScreen);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, toScreen) => {
    e.preventDefault();
    
    if (!draggedFlag || draggedFromScreen === toScreen) return;

    try {
      // Move from one screen to another or to/from unassigned
      if (draggedFromScreen === 'unassigned' && toScreen !== 'unassigned') {
        // Moving from unassigned to a screen
        const response = await getScreens();
        const screen = response.data.find(s => s.name === toScreen);
        if (screen) {
          await addKeyToScreen(screen._id, draggedFlag);
        }
      } else if (draggedFromScreen !== 'unassigned' && toScreen === 'unassigned') {
        // Moving from a screen to unassigned
        const response = await getScreens();
        const screen = response.data.find(s => s.name === draggedFromScreen);
        if (screen) {
          await removeKeyFromScreen(screen._id, draggedFlag);
        }
      } else if (draggedFromScreen !== 'unassigned' && toScreen !== 'unassigned') {
        // Moving from one screen to another screen
        const response = await getScreens();
        const fromScreen = response.data.find(s => s.name === draggedFromScreen);
        const targetScreen = response.data.find(s => s.name === toScreen);
        
        if (fromScreen && targetScreen) {
          await removeKeyFromScreen(fromScreen._id, draggedFlag);
          await addKeyToScreen(targetScreen._id, draggedFlag);
        }
      }

      // Reload configuration to update UI
      await loadCustomScreenConfiguration();
    } catch (error) {
      console.error('Error during drag and drop:', error);
      alert('Error moving key. Please try again.');
    }

    setDraggedFlag(null);
    setDraggedFromScreen(null);
  };

  // Toggle screen collapse state
  const toggleScreenCollapse = (screenName) => {
    const newCollapsed = new Set(collapsedScreens);
    if (newCollapsed.has(screenName)) {
      newCollapsed.delete(screenName);
    } else {
      newCollapsed.add(screenName);
    }
    setCollapsedScreens(newCollapsed);
  };

  // Handle screen drag and drop for reordering
  const handleScreenDragStart = (e, screenName) => {
    setDraggedScreen(screenName);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleScreenDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleScreenDrop = async (e, targetScreenName) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedScreen || draggedScreen === targetScreenName) {
      setDraggedScreen(null);
      return;
    }

    const newOrder = [...screenOrder];
    const draggedIndex = newOrder.indexOf(draggedScreen);
    const targetIndex = newOrder.indexOf(targetScreenName);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Remove the dragged screen from its current position
      newOrder.splice(draggedIndex, 1);
      // Insert it before the target position
      newOrder.splice(targetIndex, 0, draggedScreen);

      // Update UI immediately (optimistic update)
      setScreenOrder(newOrder);

      try {
        // Get screen data to create the reorder payload
        const response = await getScreens();
        const screens = response.data;

        // Create the screenOrders array with id and order
        const screenOrders = newOrder.map((screenName, index) => {
          const screen = screens.find(s => s.name === screenName);
          return {
            screenId: screen?._id,
            order: index
          };
        }).filter(item => item.screenId); // Remove items without screenId

        // Call the backend API
        await reorderScreens(screenOrders);

        console.log('Screen order updated successfully');
      } catch (error) {
        console.error('Error updating screen order:', error);

        // Check if it's a 404 (endpoint not implemented yet)
        if (error.response && error.response.status === 404) {
          console.warn('Backend API for reordering not yet implemented. Order saved temporarily in frontend.');
          // Keep the new order in the UI until backend is ready
        } else if (error.response && error.response.status === 500) {
          console.warn('Backend API for reordering not yet implemented (500 error). Order saved temporarily in frontend.');
          // Keep the new order in the UI until backend is ready
        } else {
          // For other errors, revert the order
          await loadCustomScreenConfiguration();
          alert('Error updating screen order. The order has been reverted.');
        }
      }
    }

    setDraggedScreen(null);
  };

  const handleScreenDragEnd = () => {
    setDraggedScreen(null);
  };


  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b bg-white p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Screen Management</h1>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading translations...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b bg-white p-6">
        <div className="space-y-4">
          {/* Title and navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Screen Management</h1>
            </div>
            
            <CreateScreenButton onCreate={createNewScreen} />
          </div>
          
        </div>
      </div>

      {/* Screen Management Interface */}
      <div className="p-6">
        <div className="space-y-6">
          {/* Unassigned Flags */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-700 flex items-center gap-2">
                <span className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {unassignedFlags.size}
                </span>
                Unassigned Keys
              </h3>
              
              {unassignedFlags.size > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllUnassignedFlags}
                    className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearUnassignedSelection}
                    disabled={selectedUnassignedFlags.size === 0}
                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    Clear ({selectedUnassignedFlags.size})
                  </button>
                  <AssignToScreenDropdown
                    selectedCount={selectedUnassignedFlags.size}
                    customScreens={customScreens}
                    onAssign={assignSelectedToScreen}
                    disabled={selectedUnassignedFlags.size === 0}
                  />
                </div>
              )}
            </div>
            
            <div className="min-h-[80px] border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
              <div className="flex flex-wrap gap-2">
                {Array.from(unassignedFlags).map(key => {
                  const translationValue = flatTranslations[key] || 'N/A';
                  const isSelected = selectedUnassignedFlags.has(key);
                  const fileMetadata = getFileMetadataForKey(key);

                  return (
                    <div
                      key={key}
                      onClick={() => toggleUnassignedFlag(key)}
                      className={`px-3 py-2 border-2 rounded-md cursor-pointer transition-all text-sm ${
                        isSelected
                          ? 'border-milo-red bg-red-50'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="text-gray-900 font-medium mb-1 line-clamp-2">
                        {String(translationValue)}
                      </div>
                      <div className="font-mono text-gray-500 text-xs mb-1">
                        {key}
                      </div>
                      {fileMetadata && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          <span title={fileMetadata.repository}>
                            {fileMetadata.repository.split('/')[1] || fileMetadata.repository}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
                {unassignedFlags.size === 0 && (
                  <div className="text-gray-400 text-sm italic">
                    No unassigned keys. All translation keys have been organized into screens.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Custom Screens */}
          <div className="space-y-4">
            {screenOrder.filter(screenName => customScreens[screenName]).map((screenName) => {
              const flags = customScreens[screenName];
              const isCollapsed = collapsedScreens.has(screenName);
              const isDraggedOver = draggedScreen && draggedScreen !== screenName;

              return (
                <div
                  key={screenName}
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 transition-all ${
                    isDraggedOver ? 'border-blue-400 bg-blue-50' : ''
                  } ${draggedScreen === screenName ? 'opacity-50' : ''}`}
                  onDragOver={handleScreenDragOver}
                  onDrop={(e) => handleScreenDrop(e, screenName)}
                >
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        {/* Drag handle */}
                        <div
                          className="flex flex-col gap-1 text-gray-400 cursor-move p-2 hover:text-gray-600 transition-colors"
                          draggable
                          onDragStart={(e) => handleScreenDragStart(e, screenName)}
                          onDragEnd={handleScreenDragEnd}
                          title="Drag to reorder screens"
                        >
                          <div className="w-1 h-1 bg-current rounded-full"></div>
                          <div className="w-1 h-1 bg-current rounded-full"></div>
                          <div className="w-1 h-1 bg-current rounded-full"></div>
                        </div>

                        {/* Collapse/Expand button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleScreenCollapse(screenName);
                          }}
                          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <svg
                            className={`w-4 h-4 text-gray-500 transition-transform ${
                              isCollapsed ? '-rotate-90' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        <h3 className="text-lg font-semibold text-gray-900">{screenName}</h3>
                        <span className="text-sm text-gray-500">
                          ({Array.from(flags).length} flags)
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCustomScreen(screenName);
                        }}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      >
                        Delete Screen
                      </button>
                    </div>
                  </div>
                  {!isCollapsed ? (
                    <div
                      className="p-6"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, screenName)}
                    >
                      <div className="min-h-[80px] border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                        <div className="flex flex-wrap gap-2">
                          {Array.from(flags).map(key => {
                            const translationValue = flatTranslations[key] || 'N/A';
                            const fileMetadata = getFileMetadataForKey(key);

                            return (
                              <div
                                key={key}
                                draggable
                                onDragStart={(e) => handleDragStart(e, key, screenName)}
                                className="px-3 py-2 bg-white border border-gray-200 rounded-md cursor-move hover:shadow-sm transition-shadow text-sm relative group"
                              >
                                <div className="text-gray-900 font-medium mb-1 line-clamp-2">
                                  {String(translationValue)}
                                </div>
                                <div className="font-mono text-gray-500 text-xs mb-1">
                                  {key}
                                </div>
                                {fileMetadata && (
                                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    <span title={`${fileMetadata.repository}/${fileMetadata.folder}/${fileMetadata.fileName}`}>
                                      {fileMetadata.repository.split('/')[1] || fileMetadata.repository}
                                    </span>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-gray-400">{fileMetadata.folder}</span>
                                  </div>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeKeyFromCustomScreen(screenName, key);
                                  }}
                                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                                  title="Remove key from screen"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                          {Array.from(flags).length === 0 && (
                            <div className="text-gray-400 text-sm italic">
                              Select keys from "Unassigned Keys" and assign them to this screen
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // When collapsed, show a minimal drop zone
                    <div className={`h-4 transition-all ${
                      draggedScreen && draggedScreen !== screenName
                        ? 'bg-blue-100 border-t border-blue-200'
                        : ''
                    }`}></div>
                  )}
                </div>
              );
            })}
            
            {Object.keys(customScreens).length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-gray-400 text-lg mb-4">No custom screens created yet</div>
                <div className="text-gray-500 text-sm">Click "Add Screen" to create your first custom screen and start organizing your translation keys</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScreensManagement;
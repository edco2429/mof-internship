
import React, { useState, useEffect } from 'react';
import { Plus, Settings, Users, Clock, AlertTriangle, Trash2, Edit, Check, X, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface ControlButton {
  id: number;
  label: string;
  state: 'ON' | 'AUTO' | 'OFF';
  autoMode?: {
    type: 'timer' | 'sensor';
    onTime?: string;
    offTime?: string;
    overrideWarnings: number;
  };
  groupId?: string;
}

interface Group {
  id: string;
  name: string;
  buttonIds: number[];
}

interface User {
  id: string;
  email: string;
  role: 'Operator' | 'Viewer';
  status: 'Pending' | 'Accepted' | 'Declined';
}

const Index = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [buttons, setButtons] = useState<ControlButton[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingButton, setEditingButton] = useState<number | null>(null);
  const [editButtonName, setEditButtonName] = useState('');
  const [buttonCount, setButtonCount] = useState('');
  const [selectedButtons, setSelectedButtons] = useState<number[]>([]);
  const [groupName, setGroupName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'Operator' | 'Viewer'>('Operator');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [buttonToDelete, setButtonToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  // Update current time every second for real-time display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Apply theme class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Simulate sensor data
  useEffect(() => {
    const sensorSimulation = setInterval(() => {
      setButtons(prev => prev.map(button => {
        if (button.state === 'AUTO' && button.autoMode?.type === 'sensor') {
          return {
            ...button,
            state: Math.random() > 0.5 ? 'ON' : 'OFF' as 'ON' | 'OFF'
          };
        }
        return button;
      }));
    }, 5000);
    return () => clearInterval(sensorSimulation);
  }, []);

  const createButtons = () => {
    const count = parseInt(buttonCount);
    if (count < 1 || count > 120) {
      toast({
        title: "Invalid Input",
        description: "Please enter a number between 1 and 120",
        variant: "destructive"
      });
      return;
    }

    const newButtons: ControlButton[] = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      label: `Button ${i + 1}`,
      state: 'OFF',
      autoMode: {
        type: 'timer',
        onTime: '09:00',
        offTime: '19:00',
        overrideWarnings: 0
      }
    }));

    setButtons(newButtons);
    setIsAddModalOpen(false);
    setButtonCount('');
    
    toast({
      title: "Buttons Created",
      description: `Successfully created ${count} button${count > 1 ? 's' : ''}`,
    });
  };

  const deleteButton = (buttonId: number) => {
    setButtons(prev => prev.filter(button => button.id !== buttonId));
    setGroups(prev => prev.map(group => ({
      ...group,
      buttonIds: group.buttonIds.filter(id => id !== buttonId)
    })));
    setButtonToDelete(null);
    
    toast({
      title: "Button Deleted",
      description: "Button removed successfully",
    });
  };

  const updateButtonState = (buttonId: number, newState: 'ON' | 'AUTO' | 'OFF') => {
    setButtons(prev => prev.map(button => {
      if (button.id === buttonId) {
        if (button.state === 'AUTO' && newState !== 'AUTO' && button.autoMode) {
          if (button.autoMode.overrideWarnings < 3) {
            toast({
              title: "Auto Control Warning",
              description: "This button is auto-controlled!",
              variant: "destructive"
            });
            return {
              ...button,
              autoMode: {
                ...button.autoMode,
                overrideWarnings: button.autoMode.overrideWarnings + 1
              }
            };
          }
        }
        
        return { ...button, state: newState };
      }
      return button;
    }));
  };

  const updateAutoMode = (buttonId: number, autoMode: any) => {
    setButtons(prev => prev.map(button => 
      button.id === buttonId ? { ...button, autoMode } : button
    ));
  };

  const saveButtonName = (buttonId: number) => {
    if (!editButtonName.trim()) {
      toast({
        title: "Invalid Name",
        description: "Please enter a valid button name",
        variant: "destructive"
      });
      return;
    }

    setButtons(prev => prev.map(button => 
      button.id === buttonId ? { ...button, label: editButtonName } : button
    ));
    
    setEditingButton(null);
    setEditButtonName('');
    
    toast({
      title: "Name Updated",
      description: "Button name updated successfully",
    });
  };

  const startEditingButton = (button: ControlButton) => {
    setEditingButton(button.id);
    setEditButtonName(button.label);
  };

  const createGroup = () => {
    if (!groupName.trim() || selectedButtons.length === 0) {
      toast({
        title: "Invalid Group",
        description: "Please enter a group name and select buttons",
        variant: "destructive"
      });
      return;
    }

    const newGroup: Group = {
      id: Date.now().toString(),
      name: groupName,
      buttonIds: selectedButtons
    };

    setGroups(prev => [...prev, newGroup]);
    setGroupName('');
    setSelectedButtons([]);
    setIsGroupModalOpen(false);
    
    toast({
      title: "Group Created",
      description: `Group "${newGroup.name}" created successfully`,
    });
  };

  const addUser = () => {
    if (!userEmail.trim()) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    const newUser: User = {
      id: Date.now().toString(),
      email: userEmail,
      role: userRole,
      status: 'Pending'
    };

    setUsers(prev => [...prev, newUser]);
    setUserEmail('');
    setIsUserModalOpen(false);
    
    toast({
      title: "User Invited",
      description: `Invitation sent to ${newUser.email}`,
    });

    setTimeout(() => {
      setUsers(prev => prev.map(user => 
        user.id === newUser.id 
          ? { ...user, status: Math.random() > 0.3 ? 'Accepted' : 'Declined' as 'Accepted' | 'Declined' }
          : user
      ));
    }, 3000);
  };

  const deleteGroup = (groupId: string) => {
    setGroups(prev => prev.filter(group => group.id !== groupId));
    toast({
      title: "Group Deleted",
      description: "Group removed successfully",
    });
  };

  const isTimerActive = (button: ControlButton) => {
    if (button.state !== 'AUTO' || !button.autoMode?.onTime) return false;
    
    const now = currentTime;
    const [onHour, onMin] = button.autoMode.onTime.split(':').map(Number);
    const [offHour, offMin] = button.autoMode.offTime?.split(':').map(Number) || [19, 0];
    
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const onMinutes = onHour * 60 + onMin;
    const offMinutes = offHour * 60 + offMin;
    
    return currentMinutes >= onMinutes && currentMinutes < offMinutes;
  };

  const getTimeRemaining = (button: ControlButton) => {
    if (button.state !== 'AUTO' || !button.autoMode?.onTime) return null;
    
    const now = currentTime;
    const [onHour, onMin] = button.autoMode.onTime.split(':').map(Number);
    const [offHour, offMin] = button.autoMode.offTime?.split(':').map(Number) || [19, 0];
    
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const onMinutes = onHour * 60 + onMin;
    const offMinutes = offHour * 60 + offMin;
    
    const isActive = currentMinutes >= onMinutes && currentMinutes < offMinutes;
    const nextChangeMinutes = isActive ? offMinutes : onMinutes;
    
    let remainingMinutes = nextChangeMinutes - currentMinutes;
    if (remainingMinutes <= 0) remainingMinutes += 24 * 60; // Next day
    
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    
    return {
      hours,
      minutes,
      isActive,
      nextAction: isActive ? 'OFF' : 'ON'
    };
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-white'} p-4`}>
      {/* Navigation Bar */}
      <nav className={`mb-8 p-4 rounded-lg transition-all duration-300 ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-gray-50 border-gray-200'} border shadow-sm`}>
        <div className="flex justify-between items-center">
          <h1 className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Owner Dashboard
          </h1>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className={`transition-all duration-300 ${isDarkMode ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
              >
                <Settings className={`w-5 h-5 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-800'}`} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className={`w-48 p-2 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`} align="end">
              <div className="space-y-2">
                <div className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Theme</div>
                <button
                  onClick={() => setIsDarkMode(false)}
                  className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded text-sm transition-colors ${
                    !isDarkMode 
                      ? 'bg-blue-100 text-blue-800' 
                      : isDarkMode 
                        ? 'text-white hover:bg-slate-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => setIsDarkMode(true)}
                  className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded text-sm transition-colors ${
                    isDarkMode 
                      ? 'bg-slate-700 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>Dark</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </nav>

      {/* Welcome Container */}
      <div className="mb-8 text-center animate-fade-in">
        <div className={`backdrop-blur-sm border rounded-lg p-8 mx-auto max-w-4xl transition-all duration-300 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50/80 border-gray-200'} shadow-sm`}>
          <h1 className={`text-4xl font-bold mb-4 animate-scale-in transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Welcome Home!
          </h1>
          <p className={`text-lg transition-colors duration-300 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
            Manage your control buttons and environment settings
          </p>
        </div>
      </div>

      {/* Button Grid */}
      {buttons.length > 0 && (
        <div className="mb-8">
          <h2 className={`text-2xl font-semibold mb-6 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Control Panel</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {buttons.map((button) => {
              const timeRemaining = getTimeRemaining(button);
              return (
                <div key={button.id} className={`backdrop-blur-sm border rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl ${isDarkMode ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700/70' : 'bg-white border-gray-200 hover:bg-gray-50 shadow-lg'}`}>
                  <div className="flex items-center justify-between mb-4">
                    {editingButton === button.id ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <Input
                          value={editButtonName}
                          onChange={(e) => setEditButtonName(e.target.value)}
                          className={`flex-1 ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-gray-50 border-gray-300'}`}
                          onKeyPress={(e) => e.key === 'Enter' && saveButtonName(button.id)}
                        />
                        <Button
                          size="sm"
                          onClick={() => saveButtonName(button.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingButton(null)}
                          className={`${isDarkMode ? 'border-slate-500 hover:bg-slate-600' : 'border-gray-300 hover:bg-gray-50'}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h3 className={`font-medium text-lg transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{button.label}</h3>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingButton(button)}
                            className={`transition-all duration-200 hover:scale-110 ${isDarkMode ? 'hover:bg-slate-600 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`transition-all duration-200 hover:scale-110 text-red-500 hover:text-red-600 ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-100'}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                              <AlertDialogHeader>
                                <AlertDialogTitle className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Delete Button</AlertDialogTitle>
                                <AlertDialogDescription className={`${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                  Are you sure you want to delete "{button.label}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className={`${isDarkMode ? 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteButton(button.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Status Bar */}
                  <div className="mb-4">
                    <div className={`px-3 py-2 rounded-lg text-center font-medium transition-all duration-300 ${
                      button.state === 'ON' ? 'bg-green-600 text-white shadow-lg shadow-green-500/25' :
                      button.state === 'AUTO' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' :
                      'bg-red-600 text-white shadow-lg shadow-red-500/25'
                    }`}>
                      {button.state === 'ON' ? 'Active' : 
                       button.state === 'AUTO' ? 'Auto Mode' : 'Inactive'}
                    </div>
                  </div>

                  {/* Timer Display for AUTO mode */}
                  {button.state === 'AUTO' && timeRemaining && (
                    <div className={`mb-4 p-3 rounded-lg text-center transition-all duration-300 ${isDarkMode ? 'bg-slate-600/50 border border-slate-500' : 'bg-gray-50 border border-gray-200'}`}>
                      <div className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        Next: {timeRemaining.nextAction} in
                      </div>
                      <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {String(timeRemaining.hours).padStart(2, '0')}:
                        {String(timeRemaining.minutes).padStart(2, '0')}
                      </div>
                      <div className={`text-xs ${timeRemaining.isActive ? 'text-green-500' : 'text-red-500'}`}>
                        Currently {timeRemaining.isActive ? 'ON' : 'OFF'}
                      </div>
                    </div>
                  )}

                  {/* Control Buttons - Reordered: ON, AUTO, OFF */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => updateButtonState(button.id, 'ON')}
                      className={`p-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                        button.state === 'ON' 
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' 
                          : isDarkMode 
                            ? 'bg-slate-600 text-slate-300 hover:bg-green-500/20 hover:text-green-400' 
                            : 'bg-gray-200 text-gray-700 hover:bg-green-500/20 hover:text-green-600'
                      }`}
                    >
                      On
                    </button>
                    
                    <button
                      onClick={() => updateButtonState(button.id, 'AUTO')}
                      className={`p-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                        button.state === 'AUTO' 
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                          : isDarkMode 
                            ? 'bg-slate-600 text-slate-300 hover:bg-blue-500/20 hover:text-blue-400' 
                            : 'bg-gray-200 text-gray-700 hover:bg-blue-500/20 hover:text-blue-600'
                      }`}
                    >
                      Auto
                    </button>
                    
                    <button
                      onClick={() => updateButtonState(button.id, 'OFF')}
                      className={`p-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                        button.state === 'OFF' 
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' 
                          : isDarkMode 
                            ? 'bg-slate-600 text-slate-300 hover:bg-red-500/20 hover:text-red-400' 
                            : 'bg-gray-200 text-gray-700 hover:bg-red-500/20 hover:text-red-600'
                      }`}
                    >
                      Off
                    </button>
                  </div>

                  {/* Auto Mode Settings */}
                  {button.state === 'AUTO' && (
                    <div className="mt-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className={`w-full transition-all duration-300 ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white hover:bg-slate-500' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
                            <Settings className="w-4 h-4 mr-2" />
                            Auto Settings
                          </Button>
                        </DialogTrigger>
                        <DialogContent className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                          <DialogHeader>
                            <DialogTitle className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Auto Mode Settings - {button.label}</DialogTitle>
                          </DialogHeader>
                          <Tabs defaultValue="timer">
                            <TabsList className={`grid w-full grid-cols-2 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                              <TabsTrigger value="timer" className={`${isDarkMode ? 'text-white data-[state=active]:bg-slate-600' : 'text-gray-800 data-[state=active]:bg-white'}`}>Timer Mode</TabsTrigger>
                              <TabsTrigger value="sensor" className={`${isDarkMode ? 'text-white data-[state=active]:bg-slate-600' : 'text-gray-800 data-[state=active]:bg-white'}`}>Sensor Mode</TabsTrigger>
                            </TabsList>
                            <TabsContent value="timer" className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="onTime" className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>ON Time</Label>
                                <Input
                                  id="onTime"
                                  type="time"
                                  value={button.autoMode?.onTime || '09:00'}
                                  onChange={(e) => updateAutoMode(button.id, {
                                    ...button.autoMode,
                                    type: 'timer',
                                    onTime: e.target.value
                                  })}
                                  className={`${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300'}`}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="offTime" className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>OFF Time</Label>
                                <Input
                                  id="offTime"
                                  type="time"
                                  value={button.autoMode?.offTime || '19:00'}
                                  onChange={(e) => updateAutoMode(button.id, {
                                    ...button.autoMode,
                                    type: 'timer',
                                    offTime: e.target.value
                                  })}
                                  className={`${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300'}`}
                                />
                              </div>
                              <div className={`flex items-center space-x-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                <Clock className="w-4 h-4" />
                                <span>Current: {currentTime.toLocaleTimeString()}</span>
                              </div>
                            </TabsContent>
                            <TabsContent value="sensor" className="space-y-4">
                              <div className="text-center">
                                <Button 
                                  onClick={() => updateAutoMode(button.id, { ...button.autoMode, type: 'sensor' })}
                                  className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                  Enable Sensor Mode
                                </Button>
                                <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                  Button will automatically respond to sensor data
                                </p>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  {/* Status Badges */}
                  {button.state === 'AUTO' && (
                    <div className="mt-3 flex justify-center">
                      {button.autoMode?.type === 'timer' && (
                        <Badge variant={isTimerActive(button) ? "default" : "secondary"} className="text-xs">
                          {isTimerActive(button) ? 'Timer ON' : 'Timer OFF'}
                        </Badge>
                      )}
                      {button.autoMode?.type === 'sensor' && (
                        <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">
                          Sensor Mode
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Group Management */}
      {buttons.length > 0 && (
        <Card className={`mb-8 transition-all duration-300 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-gray-200'} backdrop-blur-sm shadow-lg`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              <Users className="w-5 h-5" />
              Group Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:scale-105">Create Group</Button>
                </DialogTrigger>
                <DialogContent className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                  <DialogHeader>
                    <DialogTitle className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Create Button Group</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="groupName" className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Group Name</Label>
                      <Input
                        id="groupName"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Enter group name"
                        className={`${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300'}`}
                      />
                    </div>
                    <div>
                      <Label className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Select Buttons</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                        {buttons.map((button) => (
                          <div key={button.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`button-${button.id}`}
                              checked={selectedButtons.includes(button.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedButtons(prev => [...prev, button.id]);
                                } else {
                                  setSelectedButtons(prev => prev.filter(id => id !== button.id));
                                }
                              }}
                            />
                            <Label htmlFor={`button-${button.id}`} className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                              {button.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button onClick={createGroup} className="w-full bg-blue-600 hover:bg-blue-700">
                      Create Group
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {groups.length > 0 && (
              <div className="space-y-4">
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Existing Groups</h3>
                <div className="grid gap-4">
                  {groups.map((group) => (
                    <Card key={group.id} className={`p-4 transition-all duration-300 ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{group.name}</h4>
                          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            {group.buttonIds.length} button{group.buttonIds.length > 1 ? 's' : ''}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteGroup(group.id)}
                          className="transition-all duration-300 hover:scale-105"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* User Management */}
      <Card className={`mb-8 transition-all duration-300 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-gray-200'} backdrop-blur-sm shadow-lg`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            <Users className="w-5 h-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
            <DialogTrigger asChild>
              <Button className="mb-4 bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:scale-105">Invite User</Button>
            </DialogTrigger>
            <DialogContent className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <DialogHeader>
                <DialogTitle className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Invite New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userEmail" className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Email Address</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="user@example.com"
                    className={`${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300'}`}
                  />
                </div>
                <div>
                  <Label htmlFor="userRole" className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Role</Label>
                  <Select value={userRole} onValueChange={(value: 'Operator' | 'Viewer') => setUserRole(value)}>
                    <SelectTrigger className={`${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300'}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operator">Operator</SelectItem>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addUser} className="w-full bg-blue-600 hover:bg-blue-700">
                  Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {users.length > 0 && (
            <div className="space-y-4">
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Team Members</h3>
              <div className="space-y-2">
                {users.map((user) => (
                  <Card key={user.id} className={`p-4 transition-all duration-300 ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{user.email}</p>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{user.role}</p>
                      </div>
                      <Badge 
                        variant={
                          user.status === 'Accepted' ? 'default' :
                          user.status === 'Declined' ? 'destructive' : 'secondary'
                        }
                      >
                        {user.status === 'Accepted' && <Check className="w-3 h-3 mr-1" />}
                        {user.status === 'Declined' && <X className="w-3 h-3 mr-1" />}
                        {user.status === 'Pending' && <Clock className="w-3 h-3 mr-1" />}
                        {user.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating Add Button - Redesigned Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className={`max-w-md ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <DialogHeader className="text-center pb-4">
            <DialogTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Create Control Buttons
            </DialogTitle>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Add new buttons to your control panel
            </p>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="buttonCount" className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Number of buttons (1-120)
              </Label>
              <Input
                id="buttonCount"
                type="number"
                min="1"
                max="120"
                value={buttonCount}
                onChange={(e) => setButtonCount(e.target.value)}
                placeholder="Enter quantity"
                className={`text-center text-lg h-12 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300'}`}
              />
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Each button can be configured with ON/AUTO/OFF controls
              </p>
            </div>
            <Button 
              onClick={createButtons} 
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 transition-all duration-300 font-medium"
              disabled={!buttonCount || parseInt(buttonCount) < 1 || parseInt(buttonCount) > 120}
            >
              Create Buttons
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;

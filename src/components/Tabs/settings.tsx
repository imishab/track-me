"use client"

import React from 'react'
import Header from '../layout/Header'
import { Switch } from '../ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { Card, CardContent } from '../ui/card'
import { useTheme } from 'next-themes'
import { Moon, Share2, LogOut, ChevronRight, User } from 'lucide-react'

export default function Settings() {
    const { theme, setTheme } = useTheme()

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'TrackMe',
                    text: 'Check out this awesome app!',
                    url: window.location.href,
                })
            } catch (error) {
                console.log('Error sharing:', error)
            }
        } else {
            alert('Sharing is not supported on this device.')
        }
    }

    const handleLogout = () => {
        // Implement logout logic here
        console.log('Logging out...')
    }

    return (
        <div className="">
            <Header>
                <p className="text-lg font-semibold dark:text-white text-black">Settings</p>
            </Header>

            <div className="pt-20 space-y-6 max-w-md mx-auto">
                {/* Account Section */}
                <div className="flex items-center gap-4 ">
                    <Avatar className="h-16 w-16 border-2 border-border">
                        <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                        <AvatarFallback>
                            <User className="w-8 h-8 opacity-50" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <p className="text-xl font-bold">Jane Doe</p>
                        <p className="text-sm text-muted-foreground">jane.doe@example.com</p>
                    </div>
                </div>

                <Separator />

                {/* Preferences */}
                <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground px-1  tracking-wider">Preferences</p>

                    <Card className="border shadow-sm">
                        <CardContent className="p-0">
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-secondary/50 rounded-full">
                                        <Moon className="w-5 h-5 text-foreground" />
                                    </div>
                                    <div className="flex flex-col">
                                        <Label htmlFor="dark-mode" className="text-base font-medium cursor-pointer">Dark Mode</Label>
                                        <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
                                    </div>
                                </div>
                                <Switch
                                    id="dark-mode"
                                    checked={theme === 'dark'}
                                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground px-1  tracking-wider">Actions</p>

                    <div className="space-y-3">
                        <Button
                            variant="outline"
                            className="w-full justify-between h-auto py-4 px-4 text-base font-normal bg-card hover:bg-accent"
                            onClick={handleShare}
                        >
                            <span className="flex items-center gap-3">
                                <div className="p-2 bg-secondary/50 rounded-full">
                                    <Share2 className="w-5 h-5 text-foreground" />
                                </div>
                                <span>Share App</span>
                            </span>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full justify-start h-auto py-4 px-4 text-base font-normal text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                            onClick={handleLogout}
                        >
                            <div className="p-2 bg-destructive/10 rounded-full mr-3">
                                <LogOut className="w-5 h-5" />
                            </div>
                            Log Out
                        </Button>
                    </div>
                </div>

                <div className="text-center pt-8">
                    <p className="text-xs text-muted-foreground">Version 1.0.0</p>
                </div>
            </div>
        </div>
    )
}

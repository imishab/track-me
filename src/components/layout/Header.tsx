import React from "react";
import { cn } from "@/src/lib/utils";

interface HeaderProps {
    content?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    height?: string;
}

export default function Header({ content, children, className, height = "h-17" }: HeaderProps) {
    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 dark:bg-[#000] dark:border-gray-900",
                className
            )}
        >
            <div className={cn("flex items-center px-6", height)}>
                {content || children || (
                  <></>
                )}
            </div>
        </header>
    );
}

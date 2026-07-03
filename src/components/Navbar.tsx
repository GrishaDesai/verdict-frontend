import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const Navbar = () => {
    const { theme, setTheme } = useTheme();

    return (
        <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">V</span>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        Verdict
                    </h1>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-4">
                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                        aria-label="Toggle theme"
                    >
                        {theme === "dark" ? (
                            <Sun size={20} className="text-gray-700" />
                        ) : (
                            <Moon size={20} className="text-gray-700" />
                        )}
                    </button>

                    {/* Optional: User / Account button */}
                    {/* <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                        JD
                    </div> */}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
import os

def update_company_setup_guard():
    path = r"src\components\auth\CompanySetupGuard.jsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    old_snippet = (
        '          } else if (status === 401) {\n'
        '            // Token expired or invalid — clear auth state and redirect to login\n'
        '            localStorage.removeItem("accessToken");\n'
        '            localStorage.removeItem("refreshToken");\n'
        '            localStorage.removeItem("user");\n'
        '            localStorage.removeItem("ignite_authenticated");\n'
        '            window.location.href = "/login";\n'
        '          }'
    )
    # also handle CRLF
    old_snippet_crlf = old_snippet.replace('\n', '\r\n')

    new_snippet = (
        '          } else if (status === 401) {\n'
        '            // Central axios interceptor handles token refresh and session purging if token is truly invalid\n'
        '            setError(true);\n'
        '          }'
    )
    new_snippet_crlf = new_snippet.replace('\n', '\r\n')

    if old_snippet_crlf in content:
        content = content.replace(old_snippet_crlf, new_snippet_crlf)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated CompanySetupGuard (CRLF)")
    elif old_snippet in content:
        content = content.replace(old_snippet, new_snippet)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated CompanySetupGuard (LF)")
    else:
        print("CompanySetupGuard snippet not found!")

def update_login():
    path = r"src\pages\auth\Login\Login.jsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    target = '  useEffect(() => {\n    // Non-blocking pre-warm ping to wake up cloud backend (Render) while user types credentials\n    api.get("/health/").catch(() => {});\n  }, []);'
    target_crlf = target.replace('\n', '\r\n')

    replacement = (
        '  // If user is already authenticated, redirect them to their destination immediately\n'
        '  useEffect(() => {\n'
        '    const accessToken =\n'
        '      localStorage.getItem("accessToken") ||\n'
        '      localStorage.getItem("access_token");\n'
        '    const refreshToken =\n'
        '      localStorage.getItem("refreshToken") ||\n'
        '      localStorage.getItem("refresh_token");\n'
        '\n'
        '    if (accessToken || refreshToken) {\n'
        '      let storedUser = {};\n'
        '      try {\n'
        '        storedUser = JSON.parse(localStorage.getItem("user") || "{}");\n'
        '      } catch (e) {\n'
        '        storedUser = {};\n'
        '      }\n'
        '\n'
        '      if (storedUser?.is_field_sales === true) {\n'
        '        navigate("/field-sales", { replace: true });\n'
        '        return;\n'
        '      }\n'
        '\n'
        '      const from = location.state?.from;\n'
        '      navigate(from || "/dashboard", { replace: true });\n'
        '    }\n'
        '  }, [navigate, location]);\n'
        '\n'
        '  useEffect(() => {\n'
        '    // Non-blocking pre-warm ping to wake up cloud backend (Render) while user types credentials\n'
        '    api.get("/health/").catch(() => {});\n'
        '  }, []);'
    )
    replacement_crlf = replacement.replace('\n', '\r\n')

    if target_crlf in content:
        content = content.replace(target_crlf, replacement_crlf)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated Login.jsx (CRLF)")
    elif target in content:
        content = content.replace(target, replacement)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated Login.jsx (LF)")
    else:
        print("Login.jsx target not found!")

def update_home_page():
    path = r"src\pages\landingPage\HomePage.jsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    old_part = 'import React from \'react\';'
    new_part = 'import React, { useEffect } from \'react\';\nimport { useNavigate } from \'react-router-dom\';'
    content = content.replace(old_part, new_part)

    old_func = 'const HomePage = () => {\n  return ('
    old_func_crlf = 'const HomePage = () => {\r\n  return ('

    new_func = (
        'const HomePage = () => {\n'
        '  const navigate = useNavigate();\n'
        '\n'
        '  useEffect(() => {\n'
        '    const accessToken =\n'
        '      localStorage.getItem("accessToken") ||\n'
        '      localStorage.getItem("access_token");\n'
        '    const refreshToken =\n'
        '      localStorage.getItem("refreshToken") ||\n'
        '      localStorage.getItem("refresh_token");\n'
        '\n'
        '    if (accessToken || refreshToken) {\n'
        '      let storedUser = {};\n'
        '      try {\n'
        '        storedUser = JSON.parse(localStorage.getItem("user") || "{}");\n'
        '      } catch (e) {\n'
        '        storedUser = {};\n'
        '      }\n'
        '      const target = storedUser?.is_field_sales === true ? "/field-sales" : "/dashboard";\n'
        '      navigate(target, { replace: true });\n'
        '    }\n'
        '  }, [navigate]);\n'
        '\n'
        '  return ('
    )
    new_func_crlf = new_func.replace('\n', '\r\n')

    if old_func_crlf in content:
        content = content.replace(old_func_crlf, new_func_crlf)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated HomePage.jsx (CRLF)")
    elif old_func in content:
        content = content.replace(old_func, new_func)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated HomePage.jsx (LF)")
    else:
        print("HomePage.jsx func not found!")

def update_navbar():
    path = r"src\components\landingPage\Navbar\Navbar.jsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Add auth detection after declarations
    old_marker = '  const location = useLocation();'
    old_marker_crlf = '  const location = useLocation();'

    new_marker = (
        '  const location = useLocation();\n'
        '\n'
        '  const isAuthenticated = Boolean(\n'
        '    localStorage.getItem("accessToken") ||\n'
        '    localStorage.getItem("access_token") ||\n'
        '    localStorage.getItem("refreshToken") ||\n'
        '    localStorage.getItem("refresh_token")\n'
        '  );\n'
        '\n'
        '  let storedUser = {};\n'
        '  try {\n'
        '    storedUser = JSON.parse(localStorage.getItem("user") || "{}");\n'
        '  } catch (e) {\n'
        '    storedUser = {};\n'
        '  }\n'
        '  const dashboardPath = storedUser?.is_field_sales ? "/field-sales" : "/dashboard";'
    )
    new_marker_crlf = new_marker.replace('\n', '\r\n')

    if old_marker in content:
        content = content.replace(old_marker, new_marker_crlf if '\r\n' in content else new_marker)
        print("Updated Navbar auth variables")

    # Update header actions
    old_actions = (
        '          {/* HEADER ACTIONS */}\n'
        '          <div className="header-actions">\n'
        '            <button\n'
        '              className="btn btn-login"\n'
        '              onClick={() => {\n'
        '                setIsMenuOpen(false);\n'
        '                navigate("/login");\n'
        '              }}\n'
        '            >\n'
        '              Login\n'
        '            </button>\n'
        '\n'
        '            <button\n'
        '              className="btn btn-get-started"\n'
        '              onClick={() => {\n'
        '                setIsMenuOpen(false);\n'
        '                navigate("/signup");\n'
        '              }}\n'
        '            >\n'
        '              Get Started'
    )
    old_actions_crlf = old_actions.replace('\n', '\r\n')

    new_actions = (
        '          {/* HEADER ACTIONS */}\n'
        '          <div className="header-actions">\n'
        '            {isAuthenticated ? (\n'
        '              <button\n'
        '                className="btn btn-get-started"\n'
        '                onClick={() => {\n'
        '                  setIsMenuOpen(false);\n'
        '                  navigate(dashboardPath);\n'
        '                }}\n'
        '              >\n'
        '                Go to Dashboard\n'
        '                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">\n'
        '                  <path d="M3.75 9H14.25M14.25 9L9.75 4.5M14.25 9L9.75 13.5" stroke="#071629" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>\n'
        '                </svg>\n'
        '              </button>\n'
        '            ) : (\n'
        '              <>\n'
        '                <button\n'
        '                  className="btn btn-login"\n'
        '                  onClick={() => {\n'
        '                    setIsMenuOpen(false);\n'
        '                    navigate("/login");\n'
        '                  }}\n'
        '                >\n'
        '                  Login\n'
        '                </button>\n'
        '\n'
        '                <button\n'
        '                  className="btn btn-get-started"\n'
        '                  onClick={() => {\n'
        '                    setIsMenuOpen(false);\n'
        '                    navigate("/signup");\n'
        '                  }}\n'
        '                >\n'
        '                  Get Started'
    )
    new_actions_crlf = new_actions.replace('\n', '\r\n')

    old_close = '            </button>\n          </div>'
    old_close_crlf = '            </button>\r\n          </div>'
    new_close = '            </button>\n              </>\n            )}\n          </div>'
    new_close_crlf = '            </button>\r\n              </>\r\n            )}\r\n          </div>'

    if old_actions_crlf in content:
        content = content.replace(old_actions_crlf, new_actions_crlf)
        content = content.replace(old_close_crlf, new_close_crlf)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated Navbar.jsx (CRLF)")
    elif old_actions in content:
        content = content.replace(old_actions, new_actions)
        content = content.replace(old_close, new_close)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated Navbar.jsx (LF)")
    else:
        print("Navbar.jsx actions not found!")

if __name__ == "__main__":
    update_company_setup_guard()
    update_login()
    update_home_page()
    update_navbar()

def update_create_account():
    path = r"src\pages\auth\CreateAccount\CreateAccount.jsx"
    with open(path, "r", encoding="utf-8") as f:
        c = f.read()
    c = c.replace('import React, { useState, useRef, useMemo } from "react";', 'import React, { useState, useRef, useMemo, useEffect } from "react";')
    old_hook = 'const CreateAccount = () => {\n  const navigate = useNavigate();'
    old_hook_crlf = 'const CreateAccount = () => {\r\n  const navigate = useNavigate();'
    new_hook = (
        'const CreateAccount = () => {\n'
        '  const navigate = useNavigate();\n'
        '\n'
        '  useEffect(() => {\n'
        '    const accessToken =\n'
        '      localStorage.getItem("accessToken") ||\n'
        '      localStorage.getItem("access_token");\n'
        '    const refreshToken =\n'
        '      localStorage.getItem("refreshToken") ||\n'
        '      localStorage.getItem("refresh_token");\n'
        '\n'
        '    if (accessToken || refreshToken) {\n'
        '      let storedUser = {};\n'
        '      try {\n'
        '        storedUser = JSON.parse(localStorage.getItem("user") || "{}");\n'
        '      } catch (e) {\n'
        '        storedUser = {};\n'
        '      }\n'
        '      const target = storedUser?.is_field_sales === true ? "/field-sales" : "/dashboard";\n'
        '      navigate(target, { replace: true });\n'
        '    }\n'
        '  }, [navigate]);'
    )
    if old_hook_crlf in c:
        c = c.replace(old_hook_crlf, new_hook.replace('\n', '\r\n'))
        with open(path, "w", encoding="utf-8") as f:
            f.write(c)
        print("Updated CreateAccount (CRLF)")
    elif old_hook in c:
        c = c.replace(old_hook, new_hook)
        with open(path, "w", encoding="utf-8") as f:
            f.write(c)
        print("Updated CreateAccount (LF)")
    else:
        print("CreateAccount target not found")

update_create_account()


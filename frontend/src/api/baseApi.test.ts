describe('apiBaseUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  const load = async () => (await import('./baseApi')).apiBaseUrl

  it('uses the configured absolute URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/api')
    expect(await load()).toBe('https://api.example.com/api')
  })

  it('resolves a relative path against the current origin', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '/backend/api')
    expect(await load()).toBe(`${window.location.origin}/backend/api`)
  })

  it('fails fast when not configured', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    await expect(load()).rejects.toThrow(/VITE_API_BASE_URL is not set/)
  })
})

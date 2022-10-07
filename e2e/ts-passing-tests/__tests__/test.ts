describe('Describe', (): void => {
  it('should test', (): void => {
    expect(true).toBe(true)
  })

  // eslint-disable-next-line @typescript-eslint/require-await
  it('should test async', async (): Promise<void> => {
    expect(true).toBe(true)
  })
})

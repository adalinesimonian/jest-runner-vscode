describe('Describe', () => {
  it('should test', () => {
    expect(true).toBe(true)
  })

  // eslint-disable-next-line @typescript-eslint/require-await
  it('should test async', async () => {
    expect(true).toBe(true)
  })

  it('should test with console.log', () => {
    console.log('This message was logged from the test file')
    expect(true).toBe(true)
  })
})

describe('Describe', () => {
  it('should test', () => {
    expect({ x: 5 }).toMatchSnapshot()
  })

  // eslint-disable-next-line @typescript-eslint/require-await
  it('should test async', async () => {
    expect({ x: 5 }).toMatchInlineSnapshot(`
      {
        "x": 5,
      }
    `)
  })
})

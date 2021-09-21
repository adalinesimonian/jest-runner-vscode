describe('Describe', () => {
  it('should test', () => {
    expect({ x: 5 }).toMatchSnapshot()
  })

  it('should test async', async () => {
    expect({ x: 5 }).toMatchInlineSnapshot(`
Object {
  "x": 5,
}
`)
  })
})
